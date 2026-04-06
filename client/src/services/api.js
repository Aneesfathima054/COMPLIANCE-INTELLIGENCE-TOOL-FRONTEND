import axios from "axios";
import { getToken } from "../utils/auth";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
	baseURL: API_BASE
});

api.interceptors.request.use((config) => {
	const token = getToken();

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

export const loginRequest = (payload) => api.post("/auth/login", payload);
export const registerRequest = (payload) => api.post("/auth/register", payload);

export const addComplaintRequest = (formData) =>
	api.post("/complaints/add", formData, {
		headers: {
			"Content-Type": "multipart/form-data"
		}
	});

export const getComplaintsRequest = () => api.get("/complaints");
export const assignComplaintRequest = (id, assignedTo) =>
	api.put(`/complaints/assign/${id}`, { assignedTo });
export const investigateComplaintRequest = (id, investigationNotes) =>
	api.put(`/complaints/investigate/${id}`, { investigationNotes });
export const updateComplaintStatusRequest = (id, status) =>
	api.put(`/complaints/status/${id}`, { status });
export const answerComplaintRequest = (id, reply, status = "Resolved") =>
	api.put(`/complaints/reply/${id}`, { reply, status });
export const deleteComplaintRequest = (id) => api.delete(`/complaints/${id}`);

export default api;
