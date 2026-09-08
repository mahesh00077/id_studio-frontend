import axios from 'axios';

// Use relative URL with proxy
const API_URL = '/api';

const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000/api';

export const pythonApi = axios.create({
    baseURL: PYTHON_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
// SECURITY: no Authorization header injection from localStorage anymore.
// Authentication is carried by the httpOnly session cookie (withCredentials),
// which JavaScript cannot read or steal via XSS.
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Wipe every trace of session data from the client. Called on logout and
// whenever the server rejects a request with 401 (session expired/gone).
export function clearClientStorage() {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    // Storage access can throw (private mode / iOS lockdown); ignore and continue.
  }
}

// Response interceptor
// A 401 means the session cookie is missing/expired. Previously this ALWAYS
// redirected to /login, which caused an infinite reload loop on the login
// page itself: /auth/me -> 401 -> redirect -> full page reload -> /auth/me -> ...
// Now we only redirect when it actually makes sense:
//   - never for auth endpoints (/auth/me and /auth/login handle their own state)
//   - never when we are already on /login
//   - and we always clear client-side session data first.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    if (status === 401) {
      const isAuthEndpoint = url.includes('/auth/');
      const alreadyOnLogin = window.location.pathname === '/login';

      // Session is dead -> remove any leftover local/session data.
      clearClientStorage();

      if (!isAuthEndpoint && !alreadyOnLogin) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
