const BASE = ""; // same origin in prod; vite proxy handles /api and /auth in dev

export async function getMe() {
  const res = await fetch(`${BASE}/auth/me`, { credentials: "include" });
  if (!res.ok) return { loggedIn: false };
  return res.json();
}

export async function getCapsules() {
  const res = await fetch(`${BASE}/api/capsules`, { credentials: "include" });
  if (!res.ok) throw new Error("failed to load capsules");
  return res.json();
}

export async function createCapsule(data) {
  const res = await fetch(`${BASE}/api/capsules`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("failed to create capsule");
  return res.json();
}

export async function updateCapsule(id, data) {
  const res = await fetch(`${BASE}/api/capsules/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("failed to update capsule");
  return res.json();
}

export async function deleteCapsule(id) {
  const res = await fetch(`${BASE}/api/capsules/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("failed to delete capsule");
}
