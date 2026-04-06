import React from "react";

function PredictiveInsights({ predictions = [], loading = false, error = "" }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Predictive Insights</h5>
          <span className="badge text-bg-dark">AI Forecast</span>
        </div>

        {loading ? (
          <p className="text-muted mb-0">Building forecasts...</p>
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : predictions.length === 0 ? (
          <div className="alert alert-info mb-0">No predictive data available.</div>
        ) : (
          <div className="list-group list-group-flush">
            {predictions.map((item) => (
              <div
                className="list-group-item px-0"
                key={`${item.department}-${item.predicted_risk}`}
              >
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h6 className="mb-1">{item.department}</h6>
                    <p className="mb-0 text-muted">{item.prediction}</p>
                  </div>
                  <span className="badge text-bg-primary">
                    Predicted Risk: {item.predicted_risk}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PredictiveInsights;
