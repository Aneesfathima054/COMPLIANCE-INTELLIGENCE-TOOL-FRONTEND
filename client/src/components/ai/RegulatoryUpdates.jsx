import React from "react";

function RegulatoryUpdates({ updates = [], loading = false, error = "" }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Regulatory Updates</h5>
          <span className="badge text-bg-info">Tracker</span>
        </div>

        {loading ? (
          <p className="text-muted mb-0">Loading updates...</p>
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : updates.length === 0 ? (
          <div className="alert alert-info mb-0">No regulatory updates available.</div>
        ) : (
          <div className="row g-3">
            {updates.map((update) => (
              <div className="col-md-6" key={update.id || update.title}>
                <div className="border rounded p-3 h-100 bg-light">
                  <h6 className="mb-2">{update.title}</h6>
                  <p className="mb-2 small text-muted">{update.authority}</p>
                  <p className="mb-2">{update.summary}</p>
                  <p className="mb-0">
                    <strong>Recommended Action:</strong> {update.recommended_action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RegulatoryUpdates;
