import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";

export default function DoctorHomePage() {
  const { user, logout } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const [appts, pats] = await Promise.all([
        api("/appointments"),     
        api("/patients"),     
      ]);
      setAppointments(Array.isArray(appts) ? appts : []);
      setPatients(Array.isArray(pats) ? pats : []);
    } catch (e) {
      setErr(e.message);
      setAppointments([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }

  async function decide(id, decision) {
    setErr("");
    try {
      await api(`/doctor/appointments/${id}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function setStatus(id, status) {
    setErr("");
    try {
      await api(`/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const requests = appointments.filter((a) => a.status === "requested");
  const active = appointments.filter((a) => ["accepted", "scheduled"].includes(a.status));
  const history = appointments.filter((a) => ["completed", "rejected", "canceled"].includes(a.status));

  return (
    <div className="container">
      <div className="row">
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>Doctor Dashboard</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Logged in as {user?.email} (doctor)
          </p>
        </div>

        <button type="button" style={{ width: "auto" }} onClick={logout}>
          Logout
        </button>
      </div>

      {err && <div className="err">{err}</div>}

      <div className="card">
        <div className="row">
          <h2 style={{ margin: 0, flex: 1 }}>Appointment Requests</h2>
          <button type="button" style={{ width: "auto" }} onClick={load}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="muted">No requests.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Date/Time</th>
                <th>Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.patient_name} (ID {a.patient_id})</td>
                  <td>{a.datetime}</td>
                  <td>{a.reason || ""}</td>
                  <td style={{ width: 220 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <button type="button" style={{ width: "auto" }} onClick={() => decide(a.id, "accept")}>
                        Accept
                      </button>
                      <button type="button" style={{ width: "auto" }} onClick={() => decide(a.id, "reject")}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Upcoming</h2>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : active.length === 0 ? (
          <p className="muted">No upcoming appointments.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Date/Time</th>
                <th>Status</th>
                <th>Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {active.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.patient_name}</td>
                  <td>{a.datetime}</td>
                  <td>{a.status}</td>
                  <td>{a.reason || ""}</td>
                  <td style={{ width: 220 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <button type="button" style={{ width: "auto" }} onClick={() => setStatus(a.id, "completed")}>
                        Complete
                      </button>
                      <button type="button" style={{ width: "auto" }} onClick={() => setStatus(a.id, "canceled")}>
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>My Patients</h2>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : patients.length === 0 ? (
          <p className="muted">No patients yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>DOB</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.dob}</td>
                  <td>{p.phone || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>History</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : history.length === 0 ? (
          <p className="muted">No history yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Date/Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.patient_name}</td>
                  <td>{a.datetime}</td>
                  <td>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
