  const msg = document.getElementById("msg");
  const patientsBody = document.getElementById("patientsBody");
  const apptsBody = document.getElementById("apptsBody");
  const patientSelect = document.getElementById("a_patient");

  function showMessage(text, type="ok") {
    msg.className = type;
    msg.textContent = text;
    setTimeout(() => { msg.textContent = ""; msg.className=""; }, 2500);
  }

  async function api(url, options) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return data;
  }

  async function loadPatients() {
    const patients = await api("/patients");
    patientsBody.innerHTML = "";
    patientSelect.innerHTML = "";

    for (const p of patients) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.id}</td><td>${p.name}</td><td>${p.dob}</td><td>${p.phone ?? ""}</td>`;
      patientsBody.appendChild(tr);

      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.id} — ${p.name}`;
      patientSelect.appendChild(opt);
    }

    if (patients.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" class="muted">No patients yet.</td>`;
      patientsBody.appendChild(tr);

      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Create a patient first";
      patientSelect.appendChild(opt);
    }
  }

  async function loadAppointments() {
    const appts = await api("/appointments");
    apptsBody.innerHTML = "";

    for (const a of appts) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.id}</td>
        <td>${a.datetime}</td>
        <td>${a.patient_name}</td>
        <td>${a.reason ?? ""}</td>
        <td>${a.status}</td>
      `;
      apptsBody.appendChild(tr);
    }

    if (appts.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" class="muted">No appointments yet.</td>`;
      apptsBody.appendChild(tr);
    }
  }

  document.getElementById("patientForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: document.getElementById("p_name").value.trim(),
        dob: document.getElementById("p_dob").value.trim(),
        phone: document.getElementById("p_phone").value.trim()
      };
      const created = await api("/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      showMessage(`Created patient #${created.id}`, "ok");
      e.target.reset();
      await loadPatients();
    } catch (err) {
      showMessage(err.message, "err");
    }
  });

  document.getElementById("apptForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patient_id: Number(document.getElementById("a_patient").value),
        datetime: document.getElementById("a_datetime").value.trim(),
        reason: document.getElementById("a_reason").value.trim()
      };
      const created = await api("/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      showMessage(`Created appointment #${created.id}`, "ok");
      e.target.reset();
      await loadAppointments();
    } catch (err) {
      showMessage(err.message, "err");
    }
  });

  document.getElementById("refreshPatients").addEventListener("click", () => {
    loadPatients().catch(e => showMessage(e.message, "err"));
  });

  document.getElementById("refreshAppts").addEventListener("click", () => {
    loadAppointments().catch(e => showMessage(e.message, "err"));
  });

  // initial load
  (async () => {
    try {
      await loadPatients();
      await loadAppointments();
    } catch (err) {
      showMessage(err.message, "err");
    }
  })();
