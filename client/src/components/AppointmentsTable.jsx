export default function AppointmentsTable({
  appointments,
  loading,
  onRefresh,
  onSetStatus,
}) {
  return (
    <div className="card">
      <div className="row">
        <h2 style={{ margin: 0, flex: 1 }}>Appointments</h2>
        <button
          onClick={onRefresh}
          style={{ width: "auto", marginTop: 0, padding: "10px 12px" }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : appointments.length === 0 ? (
        <p className="muted">No appointments yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date/Time</th>
              <th>Patient</th>
              <th>Reason</th>
              <th>Status</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.datetime}</td>
                <td>{a.patient_name}</td>
                <td>{a.reason ?? ""}</td>
                <td>{a.status}</td>
                <td>
                  <div className="row" style={{ gap: 8 }}>
                    <button
                      type="button"
                      style={{ width: "auto", marginTop: 0, padding: "8px 10px" }}
                      disabled={a.status === "completed"}
                      onClick={() => onSetStatus(a.id, "completed")}
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      style={{ width: "auto", marginTop: 0, padding: "8px 10px" }}
                      disabled={a.status === "canceled"}
                      onClick={() => onSetStatus(a.id, "canceled")}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      style={{ width: "auto", marginTop: 0, padding: "8px 10px" }}
                      disabled={a.status === "scheduled"}
                      onClick={() => onSetStatus(a.id, "scheduled")}
                    >
                      Undo
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


