import { useMemo } from "react";

export default function AppointmentForm({
  patients,
  patientId,
  setPatientId,
  datetime,
  setDatetime,
  reason,
  setReason,
  onSubmit,
}) {
  const hasPatients = patients.length > 0;

  const patientOptions = useMemo(() => patients, [patients]);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Create Appointment</h2>

      <form onSubmit={onSubmit}>
        <label>Patient</label>
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          disabled={!hasPatients}
          required
        >
          {!hasPatients ? (
            <option value="">Create a patient first</option>
          ) : (
            <>
              <option value="" disabled>
                Select a patient…
              </option>
              {patientOptions.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.id} — {p.name}
                </option>
              ))}
            </>
          )}
        </select>

        <div className="row">
          <div>
            <label>Date/Time</label>
            <input
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              placeholder="2025-01-05 10:30"
              required
            />
          </div>

          <div>
            <label>Status</label>
            <input value="scheduled" disabled />
          </div>
        </div>

        <label>Reason</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Annual checkup"
        />

        <button type="submit" disabled={!hasPatients}>
          Create Appointment
        </button>
      </form>
    </div>
  );
}
