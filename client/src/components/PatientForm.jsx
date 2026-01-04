export default function PatientForm({
  name,
  dob,
  phone,
  setName,
  setDob,
  setPhone,
  onSubmit,
}) {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Add Patient</h2>

      <form onSubmit={onSubmit}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Date of Birth (YYYY-MM-DD)</label>
        <input value={dob} onChange={(e) => setDob(e.target.value)} required />

        <label>Phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />

        <button type="submit">Create Patient</button>
      </form>
    </div>
  );
}

