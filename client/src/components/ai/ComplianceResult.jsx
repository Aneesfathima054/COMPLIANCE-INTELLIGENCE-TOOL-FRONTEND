import React from "react";

function ComplianceResult({ result }) {
  if (!result) {
    return null;
  }

  return (
    <div className="card border-0 shadow-sm mt-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h5 className="card-title mb-0">Compliance Analysis Result</h5>
          <span className="badge text-bg-primary">Score: {result.compliance_score}%</span>
        </div>

        {(typeof result.policy_score === "number" || typeof result.contextual_score === "number") && (
          <div className="row g-2 mb-3">
            <div className="col-sm-6">
              <div className="small text-muted">Policy Score</div>
              <div className="fw-semibold">{result.policy_score ?? "-"}%</div>
            </div>
            <div className="col-sm-6">
              <div className="small text-muted">Contextual Score</div>
              <div className="fw-semibold">{result.contextual_score ?? "-"}%</div>
            </div>
          </div>
        )}

        {typeof result.extracted_text_length === "number" && (
          <p className="small text-muted mb-3">
            Extracted text length: <strong>{result.extracted_text_length}</strong>
          </p>
        )}

        <div className="row g-3">
          <div className="col-md-6">
            <h6>Detected Policies</h6>
            {result.detected_policies?.length ? (
              <ul className="mb-0">
                {result.detected_policies.map((policy) => (
                  <li key={policy}>{policy}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mb-0">No required clauses detected.</p>
            )}
          </div>

          <div className="col-md-6">
            <h6>Missing Policies</h6>
            {result.missing_policies?.length ? (
              <ul className="mb-0 text-danger">
                {result.missing_policies.map((policy) => (
                  <li key={policy}>{policy}</li>
                ))}
              </ul>
            ) : (
              <p className="text-success mb-0">No missing required clauses.</p>
            )}
          </div>
        </div>

        <div className="alert alert-info mt-3 mb-0">
          <strong>Recommendation:</strong> {result.recommendation}
        </div>

        {result.contextual_signals?.length ? (
          <div className="mt-3">
            <h6>Contextual Signals</h6>
            <div className="d-flex flex-wrap gap-2">
              {result.contextual_signals.slice(0, 12).map((signal) => (
                <span className="badge text-bg-secondary" key={signal}>
                  {signal}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ComplianceResult;
