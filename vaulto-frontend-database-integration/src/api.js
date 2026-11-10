const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const TOKEN_KEY = 'vaulto-access-token';
export function getToken(){ return localStorage.getItem(TOKEN_KEY); }
export function saveToken(token){ localStorage.setItem(TOKEN_KEY, token); }
export function clearToken(){ localStorage.removeItem(TOKEN_KEY); }
async function request(path, options={}){
  const headers = { ...(options.body ? {'Content-Type':'application/json'} : {}), ...(options.headers || {}) };
  const token = getToken();
  if(token) headers.Authorization = `Bearer ${token}`;
  let response;
  try { response = await fetch(`${API_BASE}${path}`, { ...options, headers }); }
  catch { throw new Error(`Cannot reach the Vaulto API at ${API_BASE}. Check that FastAPI is running and CORS allows this frontend origin.`); }
  if(!response.ok){
    let message = `Request failed (${response.status})`;
    try { const body = await response.json(); message = typeof body.detail === 'string' ? body.detail : Array.isArray(body.detail) ? body.detail.map(x=>x.msg).join(', ') : message; } catch {}
    throw new Error(message);
  }
  if(response.status === 204) return null;
  return response.json();
}
export const api = {
  register: payload => request('/api/auth/register', {method:'POST',body:JSON.stringify(payload)}),
  login: payload => request('/api/auth/login', {method:'POST',body:JSON.stringify(payload)}),
  guest: () => request('/api/auth/guest', {method:'POST'}),
  me: () => request('/api/auth/me'),
  transactions: () => request('/api/transactions'),
  createTransaction: payload => request('/api/transactions', {method:'POST',body:JSON.stringify(payload)}),
  deleteTransaction: id => request(`/api/transactions/${encodeURIComponent(id)}`, {method:'DELETE'}),
  summary: month => request(`/api/dashboard/summary?month=${encodeURIComponent(month)}`),
};
