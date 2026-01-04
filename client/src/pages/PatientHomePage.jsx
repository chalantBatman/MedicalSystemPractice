import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";

export default function PatientHomePage() {
  const { user, logout } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [doctorId, setDoctorId] = useState("");

function nowForDatetimeLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

  const [datetime, setDatetime] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

async function load() {
  setErr("");
  setLoading(true);

  try {
    const [docs, appts] = await Promise.all([
      api("/doctors"),
      api("/appointments"),
    ]);

    console.log("DOCTORS RESPONSE:", docs);
    setDoctors(Array.isArray(docs) ? docs : []);
    setAppointments(Array.isArray(appts) ? appts : []);
  } catch (e) {
    setErr(e.message);
    setDoctors([]);
    setAppointments([]);
  } finally {
    setLoading(false);
  }
}


  async function requestAppointment(e) {
    e.preventDefault();
    setErr("");

    if (!doctorId) {
      setErr("Please select a doctor.");
      return;
    }

    try {
      await api("/appointments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: Number(doctorId),
          datetime,
          reason,
        }),
      });

      setDatetime("");
      setReason("");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function cancelRequest(id) {
    setErr("");
    try {
      await api(`/appointments/${id}/cancel-request`, { method: "PATCH" });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

useEffect(() => {
  setDatetime(nowForDatetimeLocal());
  load();
}, []);

  return (
    <div className="container">
      <div className="row">
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>Patient Portal</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Logged in as {user?.email}
          </p>
        </div>

        <button type="button" style={{ width: "auto" }} onClick={logout}>
          Logout
        </button>
      </div>

      {err && <div className="err">{err}</div>}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Request Appointment</h2>

        <form onSubmit={requestAppointment}>
          <label>Doctor</label>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
            <option value="">Select a doctor…</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.email} (ID {d.id})
              </option>
            ))}
          </select>

          <label>Date & Time</label>
            <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            required
            />

          <label>Reason (optional)</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} />

          <button type="submit">Request</button>
        </form>
      </div>

      <div className="card">
        <div className="row">
          <h2 style={{ margin: 0, flex: 1 }}>My Appointments</h2>
          <button type="button" style={{ width: "auto" }} onClick={load}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : appointments.length === 0 ? (
          <p className="muted">No appointments yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Doctor</th>
                <th>Date/Time</th>
                <th>Status</th>
                <th>Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.doctor_email || `Doctor ID ${a.doctor_id}`}</td>
                  <td>{a.datetime}</td>
                  <td>{a.status}</td>
                  <td>{a.reason || ""}</td>
                  <td style={{ width: 120 }}>
                    {a.status === "requested" ? (
                      <button
                        type="button"
                        style={{ width: "auto" }}
                        onClick={() => cancelRequest(a.id)}
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
