const policyCatalog = {
  GDPR: {
    title: "GDPR Data Subject Rights Clarification",
    authority: "European Data Protection Board (EDPB)",
    summary:
      "Regulators are tightening expectations for lawful basis documentation, consent records, and handling of data-subject rights including access, correction, erasure, and portability.",
    recommended_action:
      "Publish GDPR controls for lawful basis by processing purpose, consent capture/withdrawal, and a documented data-subject-request workflow with response SLAs."
  },
  "ISO 27001": {
    title: "ISO/IEC 27001 ISMS Assurance Focus",
    authority: "International Organization for Standardization (ISO)",
    summary:
      "Recent surveillance findings emphasize evidence-backed ISMS operation, including risk registers, treatment plans, and control effectiveness records.",
    recommended_action:
      "Maintain an ISMS evidence pack with risk register, Statement of Applicability, control ownership matrix, internal audit logs, and management review outcomes."
  },
  "Privacy Policy": {
    title: "Privacy Notice Transparency Update",
    authority: "National Data Protection Office",
    summary:
      "Enforcement actions increasingly cite missing disclosures on retention periods, third-party data sharing, and user-rights procedures in privacy notices.",
    recommended_action:
      "Update the privacy notice to include purpose limitation, retention schedule, third-party disclosures, and clear user-rights request channels."
  },
  "Access Control Policy": {
    title: "Access Control Governance Bulletin",
    authority: "Cybersecurity Regulatory Authority",
    summary:
      "Audits are flagging weak role definitions, excessive privileged access, and absent periodic access recertification records.",
    recommended_action:
      "Enforce role-based access control, require MFA for sensitive systems, and run monthly privileged-access reviews with auditable approvals."
  },
  "Incident Response Policy": {
    title: "Incident Response Readiness Advisory",
    authority: "National Cyber Incident Coordination Office",
    summary:
      "Regulatory reviews now assess runbook quality, response-time targets, escalation evidence, and regular incident simulation testing.",
    recommended_action:
      "Define severity-based runbooks, test response drills at least twice yearly, and track detection-to-containment metrics with post-incident corrective actions."
  }
};

const fallbackUpdates = [
  {
    id: "reg-fallback-001",
    title: "Compliance Monitoring Baseline Alert",
    authority: "Compliance Oversight Desk",
    summary:
      "No recent gap analysis was provided, so targeted regulatory alerts cannot be prioritized by policy weakness.",
    recommended_action:
      "Run document compliance analysis first, then refresh regulatory updates to get policy-specific actions."
  }
];

let latestComplianceAnalysis = null;

const normalizePolicyName = (value = "") => value.trim();

const buildUpdatesFromAnalysis = (analysis = {}) => {
  const missingPolicies = Array.isArray(analysis.missing_policies)
    ? analysis.missing_policies.map(normalizePolicyName).filter(Boolean)
    : [];
  const complianceScore = Number(analysis.compliance_score ?? 0);
  const updates = [];

  for (const missingPolicy of missingPolicies) {
    const mapped = policyCatalog[missingPolicy];

    if (!mapped) {
      continue;
    }

    updates.push({
      id: `reg-${missingPolicy.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      ...mapped,
      policy_gap: missingPolicy,
      published_at: new Date().toISOString().slice(0, 10)
    });
  }

  if (complianceScore < 60) {
    updates.push({
      id: "reg-gap-evidence-001",
      title: "Compliance Evidence and Control Documentation Gap Notice",
      authority: "Regulatory Audit Review Board",
      summary:
        "Low compliance score indicates control documentation gaps that can trigger intensified audit scrutiny and remediation mandates.",
      recommended_action:
        "Create a remediation tracker with policy owners, required evidence, due dates, and monthly status reviews until closure.",
      policy_gap: "Cross-Policy Governance",
      published_at: new Date().toISOString().slice(0, 10)
    });
  }

  const unique = [];
  const seen = new Set();

  for (const update of updates) {
    const key = update.title;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(update);
    }
  }

  return unique.slice(0, 5);
};

const setLatestComplianceAnalysis = (analysis) => {
  latestComplianceAnalysis = analysis && typeof analysis === "object" ? { ...analysis } : null;
};

const getRegulatoryUpdates = async (analysisOverride = null) => {
  const analysis = analysisOverride || latestComplianceAnalysis;
  const generated = buildUpdatesFromAnalysis(analysis || {});

  return {
    source: analysis ? "dynamic-policy-gap-analysis" : "fallback-no-analysis",
    fetched_at: new Date().toISOString(),
    updates: generated.length ? generated : fallbackUpdates
  };
};

module.exports = {
  getRegulatoryUpdates,
  setLatestComplianceAnalysis
};
