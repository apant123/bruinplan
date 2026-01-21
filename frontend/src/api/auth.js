const API_BASE = process.env.REACT_APP_API_BASE || "/api";

/* GET profile */
export async function apiGetProfile(accessToken) {
  const res = await fetch(`${API_BASE}/user/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    throw new Error(data?.error || "Failed to fetch profile");
  }

  return data;
}

/* PATCH profile */
export async function apiUpdateProfile(accessToken, partial) {
  const res = await fetch(`${API_BASE}/user/update/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(partial),
  });

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    throw new Error(data?.error || "Failed to update profile");
  }

  return data;
}
