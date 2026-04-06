const { buildDepartmentMetrics } = require("./violationDetector");

const clampRisk = (score) => Math.max(0, Math.min(100, score));

const getRiskLevel = (score) => {
  if (score <= 30) {
    return "Low";
  }

  if (score <= 60) {
    return "Medium";
  }

  return "High";
};

const computeRiskScore = ({ pending_tasks, missed_deadlines, repeated_violations }) =>
  pending_tasks * 10 + missed_deadlines * 20 + repeated_violations * 15;

const getRiskAnalysis = async () => {
  const departmentMetrics = await buildDepartmentMetrics();

  return departmentMetrics
    .map((item) => {
      const rawRiskScore = computeRiskScore(item);
      const boundedRiskScore = clampRisk(rawRiskScore);

      return {
        department: item.department,
        pending_tasks: item.pending_tasks,
        missed_deadlines: item.missed_deadlines,
        repeated_violations: item.repeated_violations,
        raw_risk_score: rawRiskScore,
        risk_score: boundedRiskScore,
        risk_level: getRiskLevel(boundedRiskScore)
      };
    })
    .sort((a, b) => b.raw_risk_score - a.raw_risk_score);
};

module.exports = {
  getRiskAnalysis,
  computeRiskScore,
  getRiskLevel
};
