import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const user = await login(email, password);

      // inside onSubmit after: const user = await login(email, password);

      if (user.role === "patient") {
        nav("/patient");        // PatientHomePage
      } else if (user.role === "doctor") {
        nav("/doctor");         // DoctorHomePage
      } else if (user.role === "staff") {
        nav("/staff");          // StaffHomePage (scheduler + admin view)
      }

    } catch (e) {
      setErr(e.message);
    }
  }

  return (
  <div className="auth-page">

    <div className="auth-title">
      <h1>ERM Medical System</h1>
      <p className="muted">Secure Patient & Staff Portal</p>
    </div>

    <div className="card auth-card">
      <h1 style={{ marginTop: 0 }}>Login</h1>

      {err && <div className="err">{err}</div>}

      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>

      <p className="muted" style={{ marginTop: 12 }}>
        Don’t have an account?{" "}
        <Link to="/register">Create one</Link>

      </p>
    </div>
  </div>
);
}
