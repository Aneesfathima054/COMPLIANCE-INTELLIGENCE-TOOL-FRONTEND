import React from "react";

function ComplianceAlerts({ alerts = [], loading = false, error = "" }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Real-Time Alerts</h5>
          <span className="badge text-bg-danger">Live</span>
        </div>

        {loading ? (
          <p className="text-muted mb-0">Checking alerts...</p>
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : alerts.length === 0 ? (
          <div className="alert alert-success mb-0">No active alerts.</div>
        ) : (
          <ul className="list-group list-group-flush">
            {alerts.map((alert, index) => (
              <li className="list-group-item px-0" key={`${alert.type}-${index}`}>
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <p className="fw-semibold mb-1">{alert.department || "System"}</p>
                    <p className="mb-0 text-muted">{alert.message}</p>
                  </div>
                  <span
                    className={`badge ${
                      alert.severity === "High"
                        ? "text-bg-danger"
                        : alert.severity === "Medium"
                          ? "text-bg-warning"
                          : "text-bg-info"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ComplianceAlerts;
