import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";

export default function AdminCreateUserPage() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("doctor"); // doctor or staff
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOkMsg("");
    setSubmitting(true);

    try {
      await api("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      setOkMsg(`Created ${role} account for ${email}`);
      setEmail("");
      setPassword("");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="row">
        <h1 style={{ margin: 0, flex: 1 }}>Create Staff/Doctor Account</h1>
        <button type="button" style={{ width: "auto" }} onClick={() => nav("/")}>
          Back
        </button>
      </div>

      {err && <div className="err">{err}</div>}
      {okMsg && <div className="ok">{okMsg}</div>}

      <div className="card">
        <form onSubmit={onSubmit}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="doctor">doctor</option>
            <option value="staff">staff</option>
          </select>

          <label>Temporary Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 12 }}>
          Patients should use <Link to="/register">Create patient account</Link>.
        </p>
      </div>
    </div>
  );
}
