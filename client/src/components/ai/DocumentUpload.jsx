import React, { useState } from "react";
import {
  uploadComplianceDocumentRequest,
  analyzeComplianceDocumentRequest
} from "../../services/aiApi";
import ComplianceResult from "./ComplianceResult";

function DocumentUpload({ onAnalysisComplete }) {
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    setError("");
    setAnalysisResult(null);
    setUploadInfo(null);
    setDocumentFile(event.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!documentFile) {
      setError("Please select a PDF, DOCX, or TXT document.");
      return;
    }

    setLoadingUpload(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("document", documentFile);

      const response = await uploadComplianceDocumentRequest(formData);
      setUploadInfo(response.data);
    } catch (uploadError) {
      setError(uploadError?.response?.data?.message || "Failed to upload document.");
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleAnalyze = async () => {
    setLoadingAnalyze(true);
    setError("");

    try {
      let response;

      if (documentFile) {
        const formData = new FormData();
        formData.append("document", documentFile);
        response = await analyzeComplianceDocumentRequest(formData);
      } else if (uploadInfo?.file_path) {
        response = await analyzeComplianceDocumentRequest({
          file_path: uploadInfo.file_path
        });
      } else {
        throw new Error("Upload a document before analysis.");
      }

      setAnalysisResult(response.data);

      if (typeof onAnalysisComplete === "function") {
        onAnalysisComplete(response.data);
      }
    } catch (analyzeError) {
      setError(analyzeError?.response?.data?.message || analyzeError.message);
    } finally {
      setLoadingAnalyze(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Document Compliance Checker</h5>
          <span className="badge text-bg-secondary">PDF / DOCX / TXT</span>
        </div>

        <div className="mb-3">
          <input
            type="file"
            className="form-control"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
          />
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className="btn btn-outline-primary" onClick={handleUpload} disabled={loadingUpload}>
            {loadingUpload ? "Uploading..." : "Upload Document"}
          </button>
          <button className="btn btn-primary" onClick={handleAnalyze} disabled={loadingAnalyze}>
            {loadingAnalyze ? "Analyzing..." : "Analyze Document"}
          </button>
        </div>

        {uploadInfo && (
          <div className="alert alert-success py-2">
            Uploaded: <strong>{uploadInfo.file_name}</strong>
          </div>
        )}

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <ComplianceResult result={analysisResult} />
      </div>
    </div>
  );
}

export default DocumentUpload;
