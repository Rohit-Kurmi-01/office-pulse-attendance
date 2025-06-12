// src/lib/authFetch.ts
// A wrapper for fetch that automatically adds the auth token from localStorage to requests

export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('access_token', token);
  }
  return fetch(input, { ...init, headers });
}
