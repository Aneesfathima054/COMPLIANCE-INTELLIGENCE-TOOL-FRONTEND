import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

function RiskDashboard({ riskData = [], loading = false, error = "" }) {
  const chartState = useMemo(() => {
    const labels = riskData.map((item) => item.department);

    return {
      labels,
      barData: {
        labels,
        datasets: [
          {
            label: "Risk Score",
            data: riskData.map((item) => item.risk_score),
            backgroundColor: "rgba(220, 53, 69, 0.7)",
            borderColor: "rgba(220, 53, 69, 1)",
            borderWidth: 1
          }
        ]
      },
      lineData: {
        labels,
        datasets: [
          {
            label: "Pending Tasks",
            data: riskData.map((item) => item.pending_tasks),
            borderColor: "rgba(13, 110, 253, 1)",
            backgroundColor: "rgba(13, 110, 253, 0.3)",
            tension: 0.3
          },
          {
            label: "Missed Deadlines",
            data: riskData.map((item) => item.missed_deadlines),
            borderColor: "rgba(255, 193, 7, 1)",
            backgroundColor: "rgba(255, 193, 7, 0.3)",
            tension: 0.3
          }
        ]
      }
    };
  }, [riskData]);

  const overview = useMemo(() => {
    const highRisk = riskData.filter((item) => item.risk_level === "High").length;
    const mediumRisk = riskData.filter((item) => item.risk_level === "Medium").length;
    const lowRisk = riskData.filter((item) => item.risk_level === "Low").length;

    return {
      highRisk,
      mediumRisk,
      lowRisk
    };
  }, [riskData]);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Department Risk Dashboard</h5>
          <span className="badge text-bg-danger">Risk Engine</span>
        </div>

        {loading ? (
          <p className="text-muted mb-0">Calculating department risk...</p>
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : riskData.length === 0 ? (
          <div className="alert alert-info mb-0">No risk data available.</div>
        ) : (
          <>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <div className="p-3 rounded bg-danger-subtle border border-danger-subtle">
                  <small className="text-muted d-block">High Risk Departments</small>
                  <h4 className="mb-0">{overview.highRisk}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded bg-warning-subtle border border-warning-subtle">
                  <small className="text-muted d-block">Medium Risk Departments</small>
                  <h4 className="mb-0">{overview.mediumRisk}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded bg-success-subtle border border-success-subtle">
                  <small className="text-muted d-block">Low Risk Departments</small>
                  <h4 className="mb-0">{overview.lowRisk}</h4>
                </div>
              </div>
            </div>

            <div className="mb-4" style={{ minHeight: 280 }}>
              <Bar
                data={chartState.barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            </div>

            <div style={{ minHeight: 240 }}>
              <Line
                data={chartState.lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom"
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RiskDashboard;
