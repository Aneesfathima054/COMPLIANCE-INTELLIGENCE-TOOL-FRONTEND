import axios from "axios";
import { getToken } from "../utils/auth";

// ✅ Base URL (NO /api here)
const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ================= AUTH =================

// ✅ Correct routes (with /api)
export const loginRequest = (payload) =>
  api.post("/api/auth/login", payload);

export const registerRequest = (payload) =>
  api.post("/api/auth/register", payload);

// ================= COMPLAINTS =================

export const addComplaintRequest = (formData) =>
  api.post("/api/complaints/add", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

export const getComplaintsRequest = () =>
  api.get("/api/complaints");

export const assignComplaintRequest = (id, assignedTo) =>
  api.put(`/api/complaints/assign/${id}`, { assignedTo });

export const investigateComplaintRequest = (id, investigationNotes) =>
  api.put(`/api/complaints/investigate/${id}`, { investigationNotes });

export const updateComplaintStatusRequest = (id, status) =>
  api.put(`/api/complaints/status/${id}`, { status });

export const answerComplaintRequest = (id, reply, status = "Resolved") =>
  api.put(`/api/complaints/reply/${id}`, { reply, status });

export const deleteComplaintRequest = (id) =>
  api.delete(`/api/complaints/${id}`);

export default api;