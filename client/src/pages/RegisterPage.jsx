import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function RegisterPage() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [patientId, setPatientId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOkMsg("");

    if (password !== confirm) {
      setErr("Passwords do not match");
      return;
    }

    const pid = Number(patientId);
    if (!Number.isInteger(pid) || pid <= 0) {
      setErr("Patient ID must be a positive number");
      return;
    }

    setSubmitting(true);
    try {
      await api("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: "patient",
          patient_id: pid,
        }),
      });

      setOkMsg("Patient account created! Redirecting to login…");
      setTimeout(() => nav("/login"), 600);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 style={{ marginTop: 0 }}>Create patient account</h1>

        <p className="muted" style={{ marginTop: 6 }}>
          Patient accounts must be linked to an existing Patient ID in the system.
        </p>

        {err && <div className="err">{err}</div>}
        {okMsg && <div className="ok">{okMsg}</div>}

        <form onSubmit={onSubmit}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label>Patient ID</label>
          <input
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="e.g. 1"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label>Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 12 }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

