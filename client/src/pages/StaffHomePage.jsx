import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";

function nowForDatetimeLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function StaffHomePage() {
  const { user, logout } = useAuth();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [datetime, setDatetime] = useState(nowForDatetimeLocal());
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const [pats, docs, appts] = await Promise.all([
        api("/patients"),
        api("/doctors"),
        api("/appointments"),
      ]);
      setPatients(Array.isArray(pats) ? pats : []);
      setDoctors(Array.isArray(docs) ? docs : []);
      setAppointments(Array.isArray(appts) ? appts : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createScheduled(e) {
    e.preventDefault();
    setErr("");

    try {
      await api("/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: Number(patientId),
          doctor_id: Number(doctorId),
          datetime,
          reason,
        }),
      });

      setReason("");
      setDatetime(nowForDatetimeLocal());
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function cancelAppt(id) {
    setErr("");
    try {
      await api(`/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "canceled" }),
      });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="container">
      <div className="row">
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>Staff Dashboard</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Logged in as {user?.email} (staff)
          </p>
        </div>
        <button type="button" style={{ width: "auto" }} onClick={logout}>Logout</button>
      </div>

      {err && <div className="err">{err}</div>}

      <div className="card">
        <div className="row">
          <h2 style={{ margin: 0, flex: 1 }}>Schedule Appointment</h2>
          <button type="button" style={{ width: "auto" }} onClick={load}>Refresh</button>
        </div>

        <form onSubmit={createScheduled}>
          <label>Patient</label>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
            <option value="">Select a patient…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (ID {p.id})
              </option>
            ))}
          </select>

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

          <button type="submit">Create Scheduled Appointment</button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Appointments Summary</h2>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : appointments.length === 0 ? (
          <p className="muted">No appointments.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date/Time</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Status</th>
                <th>Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.datetime}</td>
                  <td>{a.patient_name}</td>
                  <td>{a.doctor_email || `Doctor ID ${a.doctor_id}`}</td>
                  <td>{a.status}</td>
                  <td>{a.reason || ""}</td>
                  <td style={{ width: 120 }}>
                    {a.status !== "canceled" ? (
                      <button type="button" style={{ width: "auto" }} onClick={() => cancelAppt(a.id)}>
                        Cancel
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
