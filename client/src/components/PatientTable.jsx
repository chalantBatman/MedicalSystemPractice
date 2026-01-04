import { Link } from "react-router-dom";

export default function PatientTable({ patients, loading, onRefresh }) {
  return (
    <div className="card">
      <div className="row">
        <h2 style={{ margin: 0, flex: 1 }}>Patients</h2>
        <button
          onClick={onRefresh}
          style={{ width: "auto", marginTop: 0, padding: "10px 12px" }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
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
                <td><Link to={`/patients/${p.id}`}>{p.name}</Link></td>
                <td>{p.dob}</td>
                <td>{p.phone ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

