const API_BASE = "http://localhost:3000";

export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // IMPORTANT for sessions
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return data;
}


