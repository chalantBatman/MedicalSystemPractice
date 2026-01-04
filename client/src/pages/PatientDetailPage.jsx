import { useAuth } from "../auth";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import AppointmentForm from "../components/AppointmentForm";
import AppointmentsTable from "../components/AppointmentsTable";


export default function PatientDetailPage() {
  const { id } = useParams();
  const { user, logout } = useAuth();

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apptLoading, setApptLoading] = useState(true);
  const [err, setErr] = useState("");

  // appointment form state
  const [patientId, setPatientId] = useState(String(id || ""));
  const [datetime, setDatetime] = useState("");
  const [reason, setReason] = useState("");

  const patient = useMemo(
    () => patients.find((p) => String(p.id) === String(id)),
    [patients, id]
  );

  async function loadPatients() {
    try {
      const data = await api("/patients");
      setPatients(data);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function loadAppointments() {
    setErr("");
    setApptLoading(true);
    try {
      const data = await api("/appointments");
      // filter to this patient only
      const filtered = data.filter((a) => String(a.patient_id) === String(id) || String(a.patient_id) === String(patientId));
      setAppointments(filtered);
    } catch (e) {
      setErr(e.message);
    } finally {
      setApptLoading(false);
    }
  }

  async function createAppointment(e) {
    e.preventDefault();
    setErr("");

    try {
      await api("/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: Number(patientId),
          datetime,
          reason,
        }),
      });

      setDatetime("");
      setReason("");
      await loadAppointments();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function setAppointmentStatus(appointmentId, status) {
  setErr("");
  try {
    await api(`/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadAppointments();
  } catch (e) {
    setErr(e.message);
  }
}


  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadPatients();
      setLoading(false);
      await loadAppointments();
    })();
  }, [id]);

  return (
    <div className="container">
    <div className="row">
      <p className="muted" style={{ margin: 0, flex: 1 }}>
        Logged in as {user?.email} ({user?.role})
      </p>

      <button
        type="button"
        style={{ width: "auto", marginTop: 0 }}
        onClick={logout}
      >
        Logout
      </button>
    </div>

      <div className="row">
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>Patient</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {loading ? "Loading..." : patient ? `${patient.name} (ID ${patient.id})` : `Patient ID ${id}`}
          </p>
        </div>

        <Link to="/" style={{ alignSelf: "center" }}>
          ← Back
        </Link>
      </div>

      {err && <div className="err">{err}</div>}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Patient Info</h2>
        {loading ? (
          <p className="muted">Loading patient…</p>
        ) : patient ? (
          <table>
            <tbody>
              <tr>
                <th style={{ width: 140 }}>Name</th>
                <td>{patient.name}</td>
              </tr>
              <tr>
                <th>DOB</th>
                <td>{patient.dob}</td>
              </tr>
              <tr>
                <th>Phone</th>
                <td>{patient.phone ?? ""}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="muted">Patient not found.</p>
        )}
      </div>

      <AppointmentForm
        patients={patients}
        patientId={patientId}
        setPatientId={setPatientId}
        datetime={datetime}
        setDatetime={setDatetime}
        reason={reason}
        setReason={setReason}
        onSubmit={createAppointment}
      />

      <AppointmentsTable
        appointments={appointments}
        loading={apptLoading}
        onRefresh={loadAppointments}
        onSetStatus={setAppointmentStatus}
      />
    </div>
  );
}
