import axios from "axios";
import { getToken } from "../utils/auth";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const aiApi = axios.create({
  baseURL: `${API_BASE}/ai`
});

aiApi.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getAIViolationsRequest = () => aiApi.get("/violations");
export const getAIRiskAnalysisRequest = () => aiApi.get("/risk-analysis");
export const getAIPredictRiskRequest = () => aiApi.get("/predict-risk");
export const generateAIReportRequest = (payload = {}) =>
  aiApi.post("/generate-report", payload);
export const sendAIChatRequest = (question) => aiApi.post("/chat", { question });
export const getAIAlertsRequest = () => aiApi.get("/alerts");
export const getRegulatoryUpdatesRequest = () => aiApi.get("/regulatory-updates");
export const generateRegulatoryUpdatesRequest = (analysisPayload = {}) =>
  aiApi.post("/regulatory-updates", analysisPayload);

export const uploadComplianceDocumentRequest = (formData) =>
  aiApi.post("/upload-document", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

export const analyzeComplianceDocumentRequest = (payload) => {
  if (payload instanceof FormData) {
    return aiApi.post("/analyze-document", payload, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  }

  return aiApi.post("/analyze-document", payload);
};

export default aiApi;
