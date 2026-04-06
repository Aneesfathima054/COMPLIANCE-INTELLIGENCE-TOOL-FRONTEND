import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import {
  getAIViolationsRequest,
  getAIRiskAnalysisRequest,
  getAIPredictRiskRequest,
  generateAIReportRequest,
  getAIAlertsRequest,
  getRegulatoryUpdatesRequest
} from "../../services/aiApi";
import RiskDashboard from "./RiskDashboard";
import ViolationsTable from "./ViolationsTable";
import PredictiveInsights from "./PredictiveInsights";
import ComplianceAlerts from "./ComplianceAlerts";
import AIChatbot from "./AIChatbot";
import DocumentUpload from "./DocumentUpload";
import RegulatoryUpdates from "./RegulatoryUpdates";

ChartJS.register(ArcElement, Tooltip, Legend);

const getApiErrorMessage = (error, fallback) => {
  const status = error?.response?.status;

  if (status === 401) {
    return "Unauthorized. Your session may have expired. Please login again as Admin.";
  }

  if (status === 403) {
    return "Admin access required to view AI Compliance Intelligence.";
  }

  return error?.response?.data?.message || fallback;
};

function AIReportsPanel() {
  const [violations, setViolations] = useState([]);
  const [riskAnalysis, setRiskAnalysis] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [report, setReport] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [regulatoryUpdates, setRegulatoryUpdates] = useState([]);

  const [loadingCore, setLoadingCore] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [coreError, setCoreError] = useState("");
  const [alertsError, setAlertsError] = useState("");

  const loadCoreData = useCallback(async () => {
    setLoadingCore(true);
    setCoreError("");

    try {
      const [violationsResponse, riskResponse, predictionResponse, reportResponse, updatesResponse] =
        await Promise.all([
          getAIViolationsRequest(),
          getAIRiskAnalysisRequest(),
          getAIPredictRiskRequest(),
          generateAIReportRequest({}),
          getRegulatoryUpdatesRequest()
        ]);

      setViolations(violationsResponse?.data?.data || []);
      setRiskAnalysis(riskResponse?.data?.data || []);
      setPredictions(predictionResponse?.data?.data || []);
      setReport(reportResponse?.data || null);
      setRegulatoryUpdates(updatesResponse?.data?.updates || []);
    } catch (error) {
      setCoreError(getApiErrorMessage(error, "Failed to load AI compliance data."));
    } finally {
      setLoadingCore(false);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    setAlertsError("");

    try {
      const alertsResponse = await getAIAlertsRequest();
      setAlerts(alertsResponse?.data?.alerts || []);
    } catch (error) {
      setAlertsError(getApiErrorMessage(error, "Failed to load AI alerts."));
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    loadCoreData();
    loadAlerts();

    const alertsInterval = setInterval(() => {
      loadAlerts();
    }, 10000);

    const coreInterval = setInterval(() => {
      loadCoreData();
    }, 15000);

    return () => {
      clearInterval(alertsInterval);
      clearInterval(coreInterval);
    };
  }, [loadCoreData, loadAlerts]);

  const pieConfig = useMemo(() => {
    const stageCounts = report?.complaint_stage_counts;

    if (stageCounts && report?.data_source === "complaints_workflow") {
      const labelNames = ["Submitted", "Assigned", "Investigating", "Resolved"];
      const rawValues = [
        stageCounts.submitted || 0,
        stageCounts.assigned || 0,
        stageCounts.investigating || 0,
        stageCounts.resolved || 0
      ];
      const hasAnyValue = rawValues.some((value) => value > 0);
      const guideSliceValue = 0.2;
      const displayValues = rawValues.map((value) =>
        hasAnyValue && value === 0 ? guideSliceValue : value
      );

      return {
        rawValues,
        showGuideSlices: hasAnyValue && rawValues.some((value) => value === 0),
        data: {
          labels: labelNames.map((label, index) => `${label} (${rawValues[index]})`),
          datasets: [
            {
              data: displayValues,
              backgroundColor: [
                "rgba(13, 110, 253, 0.75)",
                "rgba(255, 193, 7, 0.75)",
                "rgba(111, 66, 193, 0.75)",
                "rgba(25, 135, 84, 0.75)"
              ],
              borderColor: [
                "rgba(13, 110, 253, 1)",
                "rgba(255, 193, 7, 1)",
                "rgba(111, 66, 193, 1)",
                "rgba(25, 135, 84, 1)"
              ],
              borderWidth: 1
            }
          ]
        }
      };
    }

    const completed = report?.completed || 0;
    const pending = report?.pending || 0;

    return {
      rawValues: [completed, pending],
      showGuideSlices: false,
      data: {
        labels: [`Completed (${completed})`, `Pending (${pending})`],
        datasets: [
          {
            data: [completed, pending],
            backgroundColor: ["rgba(25, 135, 84, 0.75)", "rgba(220, 53, 69, 0.75)"],
            borderColor: ["rgba(25, 135, 84, 1)", "rgba(220, 53, 69, 1)"],
            borderWidth: 1
          }
        ]
      }
    };
  }, [report]);

  return (
    <section className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <p className="text-uppercase text-muted small mb-1">AI Suite</p>
          <h3 className="mb-0">AI Compliance Intelligence</h3>
        </div>
        <span className="badge text-bg-primary">Live Analytics</span>
      </div>

      {coreError && <div className="alert alert-danger">{coreError}</div>}

      <div className="row g-4">
        <div className="col-12">
          <RiskDashboard riskData={riskAnalysis} loading={loadingCore} error={coreError} />
        </div>

        <div className="col-lg-7">
          <ViolationsTable violations={violations} loading={loadingCore} error={coreError} />
        </div>

        <div className="col-lg-5">
          <PredictiveInsights predictions={predictions} loading={loadingCore} error={coreError} />
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">AI Generated Report</h5>

              {loadingCore ? (
                <p className="text-muted mb-0">Generating report...</p>
              ) : report ? (
                <>
                  <p className="mb-1">
                    <strong>{report.title}</strong>
                  </p>
                  <p className="text-muted">Period: {report.period}</p>

                  <ul className="list-group list-group-flush mb-3">
                    <li className="list-group-item px-0 d-flex justify-content-between">
                      <span>{report.data_source === "complaints_workflow" ? "Total Cases" : "Total Tasks"}</span>
                      <strong>{report.total_tasks}</strong>
                    </li>
                    {report.data_source === "complaints_workflow" && report.complaint_stage_counts ? (
                      <>
                        <li className="list-group-item px-0 d-flex justify-content-between">
                          <span>Submitted</span>
                          <strong>{report.complaint_stage_counts.submitted || 0}</strong>
                        </li>
                        <li className="list-group-item px-0 d-flex justify-content-between">
                          <span>Assigned</span>
                          <strong>{report.complaint_stage_counts.assigned || 0}</strong>
                        </li>
                        <li className="list-group-item px-0 d-flex justify-content-between">
                          <span>Investigating</span>
                          <strong>{report.complaint_stage_counts.investigating || 0}</strong>
                        </li>
                        <li className="list-group-item px-0 d-flex justify-content-between">
                          <span>Resolved</span>
                          <strong>{report.complaint_stage_counts.resolved || 0}</strong>
                        </li>
                        <li className="list-group-item px-0 d-flex justify-content-between">
                          <span>Unassigned</span>
                          <strong>{report.complaint_stage_counts.unassigned || 0}</strong>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="list-group-item px-0 d-flex justify-content-between">
                          <span>Completed</span>
                          <strong>{report.completed}</strong>
                        </li>
                        <li className="list-group-item px-0 d-flex justify-content-between">
                          <span>Pending</span>
                          <strong>{report.pending}</strong>
                        </li>
                      </>
                    )}
                  </ul>

                  <div style={{ minHeight: 230 }}>
                    <Pie
                      data={pieConfig.data}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom"
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const value = pieConfig.rawValues?.[context.dataIndex] ?? 0;
                                return `${context.label}: ${value}`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>

                  {pieConfig.showGuideSlices && (
                    <p className="small text-muted mt-2 mb-0">
                      Zero-count stages are shown as thin guide slices to keep all stage colors visible.
                    </p>
                  )}

                  <div className="alert alert-info mt-3 mb-0">
                    <strong>Recommendation:</strong> {report.recommendation}
                  </div>
                </>
              ) : (
                <div className="alert alert-info mb-0">No report data available.</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <ComplianceAlerts alerts={alerts} loading={loadingAlerts} error={alertsError} />
        </div>

        <div className="col-lg-6">
          <AIChatbot />
        </div>

        <div className="col-lg-6">
          <DocumentUpload onAnalysisComplete={loadCoreData} />
        </div>

        <div className="col-12">
          <RegulatoryUpdates
            updates={regulatoryUpdates}
            loading={loadingCore}
            error={coreError}
          />
        </div>
      </div>
    </section>
  );
}

export default AIReportsPanel;
