import axios from "axios";

export const getTestBuilderAccess = () =>
  api.get('test-builder-access/').then(r => r.data);

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

const api = axios.create({
  baseURL: "/api/catalog/",
  withCredentials: true,
});

// Attach Django's CSRF token to every request
api.interceptors.request.use((config) => {
  const csrfToken = getCookie("csrftoken");
  if (csrfToken) {
    config.headers["X-CSRFToken"] = csrfToken;
  }
  return config;
});

export default api;
