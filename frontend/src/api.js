import axios from "axios";
import { getToken, clearToken } from "./auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message;

    if (status === 401 && String(msg || "").toLowerCase().includes("token")) {
      clearToken();
      // on force le retour login (sans dépendre de navigate)
      window.location.href = "/login?reason=session";
    }
    return Promise.reject(err);
  }
);

export default api;