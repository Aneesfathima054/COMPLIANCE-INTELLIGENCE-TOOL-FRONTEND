const { detectViolations, buildDepartmentMetrics } = require("./violationDetector");
const { getRiskAnalysis } = require("./riskAnalyzer");

const buildDeadlineAlerts = (violations) =>
  violations
    .filter((item) => item.violation === "Missed Deadline")
    .map((item) => ({
      type: "deadline_missed",
      department: item.department,
      severity: item.severity,
      message: `${item.department} has ${item.evidence_count} missed compliance deadline(s).`
    }));

const buildRiskAlerts = (riskAnalysis) =>
  riskAnalysis
    .filter((item) => item.risk_score > 60)
    .map((item) => ({
      type: "high_department_risk",
      department: item.department,
      severity: "High",
      message: `${item.department} risk score is ${item.risk_score}.`
    }));

const buildPendingAlerts = (departmentMetrics) =>
  departmentMetrics
    .filter((item) => item.pending_tasks > 5)
    .map((item) => ({
      type: "pending_task_overload",
      department: item.department,
      severity: "Medium",
      message: `${item.department} has ${item.pending_tasks} pending compliance tasks.`
    }));

const getRealtimeAlerts = async () => {
  const [violations, riskAnalysis, departmentMetrics] = await Promise.all([
    detectViolations(),
    getRiskAnalysis(),
    buildDepartmentMetrics()
  ]);

  const alerts = [
    ...buildDeadlineAlerts(violations),
    ...buildRiskAlerts(riskAnalysis),
    ...buildPendingAlerts(departmentMetrics)
  ];

  return {
    polling_interval_seconds: 10,
    generated_at: new Date().toISOString(),
    count: alerts.length,
    alerts
  };
};

module.exports = {
  getRealtimeAlerts
};
