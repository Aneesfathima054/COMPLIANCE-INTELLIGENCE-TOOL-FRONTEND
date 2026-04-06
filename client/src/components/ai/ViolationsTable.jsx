import React from "react";

function ViolationsTable({ violations = [], loading = false, error = "" }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Compliance Violations</h5>
          <span className="badge text-bg-secondary">{violations.length} items</span>
        </div>

        {loading ? (
          <p className="text-muted mb-0">Loading violations...</p>
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : violations.length === 0 ? (
          <div className="alert alert-success mb-0">No active violations detected.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle mb-0">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Violation</th>
                  <th>Severity</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((item, index) => (
                  <tr key={`${item.department}-${item.violation}-${index}`}>
                    <td>{item.department}</td>
                    <td>{item.violation}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.severity === "High"
                            ? "text-bg-danger"
                            : item.severity === "Medium"
                              ? "text-bg-warning"
                              : "text-bg-info"
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td>{item.evidence_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViolationsTable;
