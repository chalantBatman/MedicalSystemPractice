const express = require("express");
const app = express();
const db = require("./db");
const path = require("path");
const session = require("express-session");
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  session({
    secret: "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true },
  })
);

app.use(express.json());

//**** helpers ****//

function requireAuth(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: "Not logged in" });
  next();
}

function requiredRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.user) return res.status(401).json({ error: "Not logged in" });
    if (!roles.includes(req.session.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}


function requireSelfPatient(req, res, next) {
  const user = req.session?.user;
  if (!user) return res.status(401).json({ error: "Not logged in" });
  if (user.role !== "patient") return next(); // staff/doctor bypass
  if (String(user.patient_id) !== String(req.params.id)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}


function requireAppointmentAccess(db) {
  return (req, res, next) => {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ error: "Not logged in" });

    // staff/doctor can access
    if (user.role === "staff" || user.role === "doctor") return next();

    // patient: must own appointment
    db.get(
      "SELECT patient_id FROM appointments WHERE id = ?",
      [req.params.id],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Appointment not found" });
        if (String(row.patient_id) !== String(user.patient_id)) {
          return res.status(403).json({ error: "Forbidden" });
        }
        next();
      }
    );
  };
}

function requireStaff(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: "Not logged in" });
  if (req.session.user.role !== "staff") return res.status(403).json({ error: "Forbidden" });
  next();
}

//**** Routes ****//

app.get("/", (req, res) => {
  res.json({ ok: true, message: "ERM Medical System API running" });
});

//**** Create a new patient ****//

app.post("/patients", requiredRole("staff","doctor"), (req, res) => {
  const { name, dob, phone } = req.body;

  if (!name || !dob) {
    return res.status(400).json({ error: "Name and DOB are required" });
  }

  const sql = `
    INSERT INTO patients (name, dob, phone)
    VALUES (?, ?, ?)
  `;

  db.run(sql, [name, dob, phone], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      id: this.lastID,
      name,
      dob,
      phone
    });
  });
});


//**** Get a single patient by ID ****//

app.get(
  "/patients/:id",
  requireAuth,
  requireSelfPatient, // patient can only access themselves
  (req, res) => {
    const { id } = req.params;

    db.get(
      "SELECT id, name, dob, phone FROM patients WHERE id = ?",
      [id],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Patient not found" });
        res.json(row);
      }
    );
  }
);


// List all patients
app.get("/patients", requiredRole("staff", "doctor"), (req, res) => {
  db.all("SELECT * FROM patients", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

//**** List all doctors ****//
app.get("/doctors", requireAuth, (req, res) => {
  db.all(
    "SELECT id, email FROM users WHERE role = 'doctor' ORDER BY email",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

//**** Create an appointment (staff schedules) ****//
app.post("/appointments", requiredRole("staff"), (req, res) => {
  const { patient_id, doctor_id, datetime, reason } = req.body;

  if (!patient_id || !doctor_id || !datetime) {
    return res.status(400).json({ error: "patient_id, doctor_id, and datetime are required" });
  }

  // optional: validate doctor exists + is doctor
  db.get("SELECT id FROM users WHERE id = ? AND role = 'doctor'", [doctor_id], (err, doc) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!doc) return res.status(400).json({ error: "doctor_id is not a valid doctor" });

    db.run(
      `
      INSERT INTO appointments (patient_id, doctor_id, datetime, reason, status)
      VALUES (?, ?, ?, ?, 'scheduled')
      `,
      [patient_id, doctor_id, datetime, reason || null],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });

        res.status(201).json({
          id: this.lastID,
          patient_id,
          doctor_id,
          datetime,
          reason: reason || null,
          status: "scheduled",
        });
      }
    );
  });
});

//**** Staff edits an appointment (reschedule / reassign / cancel) ****//
app.patch("/appointments/:id", requiredRole("staff"), (req, res) => {
  const { id } = req.params;
  const { datetime, doctor_id, reason, status } = req.body;

  const allowedStatus = new Set(["scheduled", "canceled", "completed"]);
  if (status && !allowedStatus.has(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const fields = [];
  const params = [];

  if (datetime) { fields.push("datetime = ?"); params.push(datetime); }
  if (Number.isInteger(doctor_id)) { fields.push("doctor_id = ?"); params.push(doctor_id); }
  if (reason !== undefined) { fields.push("reason = ?"); params.push(reason || null); }
  if (status) { fields.push("status = ?"); params.push(status); }

  if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

  params.push(id);

  db.run(`UPDATE appointments SET ${fields.join(", ")} WHERE id = ?`, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Appointment not found" });
    res.json({ ok: true });
  });
});



//**** List all appointments with patient info ****//
app.get("/appointments", requireAuth, (req, res) => {
  const user = req.session.user;

  const baseSql = `
    SELECT
      a.id,
      a.patient_id,
      a.doctor_id,
      a.datetime,
      a.reason,
      a.status,
      p.name AS patient_name,
      p.dob AS patient_dob,
      p.phone AS patient_phone,
      d.email AS doctor_email
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    LEFT JOIN users d ON a.doctor_id = d.id
  `;

  if (user.role === "patient") {
    db.all(
      baseSql + " WHERE a.patient_id = ? ORDER BY a.datetime",
      [user.patient_id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
    return;
  }

  if (user.role === "doctor") {
    db.all(
      baseSql + " WHERE a.doctor_id = ? ORDER BY a.datetime",
      [user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
    return;
  }

  // staff
  db.all(baseSql + " ORDER BY a.datetime", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

//** List appointments for a specific doctor ***/
app.get("/doctor/appointments", requiredRole("doctor"), (req, res) => {
  const doctorId = req.session.user.id;

  const sql = `
    SELECT
      a.id,
      a.patient_id,
      a.doctor_id,
      a.datetime,
      a.reason,
      a.status,
      p.name AS patient_name,
      p.dob AS patient_dob,
      p.phone AS patient_phone
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    WHERE a.doctor_id = ?
    ORDER BY a.datetime
  `;

  db.all(sql, [doctorId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


//**** Update appointment status (scheduled | completed | canceled) ****//
app.patch("/appointments/:id/status", requiredRole("staff","doctor"), (req, res) => {
  const user = req.session.user;
  const { id } = req.params;
  const { status } = req.body;

  const allowed = new Set(["requested", "accepted", "rejected", "scheduled", "completed", "canceled"]);
  if (!allowed.has(status)) return res.status(400).json({ error: "Invalid status" });

  // doctors can only update their own appointments
  const guardSql =
    user.role === "doctor"
      ? "SELECT id FROM appointments WHERE id = ? AND doctor_id = ?"
      : "SELECT id FROM appointments WHERE id = ?";

  const guardParams = user.role === "doctor" ? [id, user.id] : [id];

  db.get(guardSql, guardParams, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(403).json({ error: "Forbidden" });

    db.run("UPDATE appointments SET status = ? WHERE id = ?", [status, id], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ id: Number(id), status });
    });
  });
});

//**** Delete an appointment ****//
app.delete("/appointments/:id", requireAuth, (req, res) => {
  const user = req.session.user;

  db.run(
    "DELETE FROM appointments WHERE id = ? AND patient_id = ?",
    [req.params.id, user.patient_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json({ ok: true });
    }
  );
});



const bcrypt = require("bcrypt");

//**** Register (for admin use) ****//

app.post("/auth/register", async (req, res) => {
  try {

    if (!req.body) {
      return res.status(400).json({ error: "Request body missing. Did you send JSON?" });
    }

    const { email, password, role, patient_id } = req.body || {};

    // Only patients can self-register.
    // staff/doctor creation requires a logged-in staff user.
    if (role !== "patient") {
      if (!req.session?.user) return res.status(401).json({ error: "Not logged in" });
      if (req.session.user.role !== "staff") return res.status(403).json({ error: "Forbidden" });
    }

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const allowed = new Set(["staff", "doctor", "patient"]);
    if (!allowed.has(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // patient must link to an existing patient record
    let linkedPatientId = null;
    if (role === "patient") {
      const pid = Number(patient_id);
      if (!Number.isInteger(pid) || pid <= 0) {
        return res.status(400).json({ error: "patient_id must be a positive integer" });
      }

      db.get("SELECT id FROM patients WHERE id = ?", [pid], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(400).json({ error: "patient_id does not exist" });

        linkedPatientId = pid;

        // check if email already exists
        db.get("SELECT id FROM users WHERE email = ?", [normalizedEmail], async (err2, existing) => {
          if (err2) return res.status(500).json({ error: err2.message });
          if (existing) return res.status(409).json({ error: "Email already registered" });

          const password_hash = await bcrypt.hash(password, 12);

          db.run(
            "INSERT INTO users (email, password_hash, role, patient_id) VALUES (?, ?, ?, ?)",
            [normalizedEmail, password_hash, role, linkedPatientId],
            function (err3) {
              if (err3) return res.status(500).json({ error: err3.message });

              res.status(201).json({
                user: {
                  id: this.lastID,
                  email: normalizedEmail,
                  role,
                  patient_id: linkedPatientId,
                },
              });
            }
          );
        });
      });

      return;
    }

    // Non-patient roles (staff/doctor) — no patient_id
    db.get("SELECT id FROM users WHERE email = ?", [normalizedEmail], async (err, existing) => {
      if (err) return res.status(500).json({ error: err.message });
      if (existing) return res.status(409).json({ error: "Email already registered" });

      const password_hash = await bcrypt.hash(password, 12);

      db.run(
        "INSERT INTO users (email, password_hash, role, patient_id) VALUES (?, ?, ?, ?)",
        [normalizedEmail, password_hash, role, null],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });

          res.status(201).json({
            user: {
              id: this.lastID,
              email: normalizedEmail,
              role,
              patient_id: null,
            },
          });
        }
      );
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

//**** Login ****//
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email/password" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  db.get(`SELECT * FROM users WHERE email = ?`, [normalizedEmail], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.user = { id: user.id, role: user.role, email: user.email, patient_id: user.patient_id };
    res.json({ ok: true, user: req.session.user });
  });
});

//**** Logout ****//
app.post("/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

//**** Get current user ****//
app.get("/auth/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

//**** Patient requests an appointment with a doctor ****//
app.post("/appointments/request", requireAuth, (req, res) => {
  const user = req.session.user;
  if (user.role !== "patient") return res.status(403).json({ error: "Only patients can request" });

  const { doctor_id, datetime, reason } = req.body;
  if (!doctor_id || !datetime) {
    return res.status(400).json({ error: "doctor_id and datetime are required" });
  }

  db.run(
    `
    INSERT INTO appointments (patient_id, doctor_id, datetime, reason, status)
    VALUES (?, ?, ?, ?, 'requested')
    `,
    [user.patient_id, doctor_id, datetime, reason || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        id: this.lastID,
        patient_id: user.patient_id,
        doctor_id,
        datetime,
        reason: reason || null,
        status: "requested",
      });
    }
  );
});

//**** Doctor accepts or rejects a requested appointment ****//
app.patch("/doctor/appointments/:id/decision", requiredRole("doctor"), (req, res) => {
  const doctorId = req.session.user.id;
  const { id } = req.params;
  const { decision } = req.body; // "accept" | "reject"

  const nextStatus =
    decision === "accept" ? "accepted" :
    decision === "reject" ? "rejected" :
    null;

  if (!nextStatus) return res.status(400).json({ error: "decision must be accept or reject" });

  db.get(
    "SELECT id, doctor_id, status FROM appointments WHERE id = ?",
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Appointment not found" });

      if (Number(row.doctor_id) !== Number(doctorId)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (row.status !== "requested") {
        return res.status(400).json({ error: "Only requested appointments can be decided" });
      }

      db.run(
        "UPDATE appointments SET status = ? WHERE id = ?",
        [nextStatus, id],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ id: Number(id), status: nextStatus });
        }
      );
    }
  );
});

//**** Doctor lists their patients ****//
app.get("/doctor/patients", requiredRole("doctor"), (req, res) => {
  const doctorId = req.session.user.id;

  const sql = `
    SELECT DISTINCT
      p.id, p.name, p.dob, p.phone
    FROM patients p
    JOIN appointments a ON a.patient_id = p.id
    WHERE a.doctor_id = ?
    ORDER BY p.name
  `;

  db.all(sql, [doctorId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});



//**** Patient cancels a requested appointment ****//
app.patch("/appointments/:id/cancel-request", requireAuth, (req, res) => {
  const user = req.session.user;
  if (user.role !== "patient") return res.status(403).json({ error: "Only patients" });

  const { id } = req.params;

  db.get("SELECT patient_id, status FROM appointments WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Appointment not found" });

    if (Number(row.patient_id) !== Number(user.patient_id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (row.status !== "requested") {
      return res.status(400).json({ error: "Only requested appointments can be canceled by patient" });
    }

    db.run("UPDATE appointments SET status = 'canceled' WHERE id = ?", [id], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ id: Number(id), status: "canceled" });
    });
  });
});


//listener
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));