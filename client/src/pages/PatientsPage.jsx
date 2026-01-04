import { useAuth } from "../auth";
import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";
import PatientForm from "../components/PatientForm";
import PatientTable from "../components/PatientTable";

export default function PatientsPage() {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");

  async function loadPatients() {
    setErr("");
    setLoading(true);
    try {
      const data = await api("/patients");
      setPatients(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createPatient(e) {
    e.preventDefault();
    setErr("");

    try {
      await api("/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dob, phone }),
      });

      setName("");
      setDob("");
      setPhone("");
      await loadPatients();
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  return (
    <div className="container">
      <h1>Patients Page</h1>
      <p className="muted">Patients</p>

      {user?.role === "staff" && (
        <Link to="/admin/create-user" style={{ alignSelf: "center" }}>
          + Create Staff/Doctor
        </Link>
      )}

      <div className="row" style={{ marginBottom: 12 }}>
        <p className="muted" style={{ margin: 0, flex: 1 }}>
          Logged in as {user?.email} ({user?.role})
        </p>
        <button
          type="button"
          style={{ width: "auto", marginTop: 0, padding: "10px 12px" }}
          onClick={logout}
        >
          Logout
        </button>
      </div>

      {err && <div className="err">{err}</div>}

      <PatientForm
        name={name}
        dob={dob}
        phone={phone}
        setName={setName}
        setDob={setDob}
        setPhone={setPhone}
        onSubmit={createPatient}
      />

      <PatientTable patients={patients} loading={loading} onRefresh={loadPatients} />
    </div>
  );
}
