const { ComplianceTask, PENDING_STATUS } = require("./violationDetector");
const { getRiskAnalysis } = require("./riskAnalyzer");

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const clampRisk = (value) => Math.max(0, Math.min(100, value));

const getTaskDate = (task) => task.created_at || task.createdAt || task.deadline || null;

const getPredictionText = (score) => {
  if (score >= 70) {
    return "Possible deadline violations next month";
  }

  if (score >= 40) {
    return "Moderate risk, monitor pending tasks closely";
  }

  return "Low immediate risk, continue routine monitoring";
};

const getPredictiveRisk = async () => {
  const riskAnalysis = await getRiskAnalysis();

  if (!riskAnalysis.length) {
    return [];
  }

  const now = new Date();
  const recentStart = new Date(now.getTime() - 30 * MS_IN_DAY);
  const previousStart = new Date(now.getTime() - 60 * MS_IN_DAY);

  const tasks = await ComplianceTask.find(
    {},
    "department status deadline created_at createdAt"
  ).lean();

  const trendsByDepartment = tasks.reduce((acc, task) => {
    const department = task.department || "Unknown";

    if (!acc[department]) {
      acc[department] = {
        recent_pending: 0,
        previous_pending: 0,
        recent_overdue: 0
      };
    }

    const status = (task.status || "").toLowerCase();

    if (status !== PENDING_STATUS) {
      return acc;
    }

    const date = getTaskDate(task);

    if (date && date >= recentStart) {
      acc[department].recent_pending += 1;
    } else if (date && date >= previousStart && date < recentStart) {
      acc[department].previous_pending += 1;
    }

    if (task.deadline && task.deadline < now) {
      acc[department].recent_overdue += 1;
    }

    return acc;
  }, {});

  return riskAnalysis
    .map((departmentRisk) => {
      const trend = trendsByDepartment[departmentRisk.department] || {
        recent_pending: 0,
        previous_pending: 0,
        recent_overdue: 0
      };

      const growthRate =
        trend.previous_pending === 0
          ? trend.recent_pending > 0
            ? 20
            : 0
          : ((trend.recent_pending - trend.previous_pending) / trend.previous_pending) * 20;

      const overdueImpact = trend.recent_overdue * 5;
      const predictedRisk = clampRisk(
        Math.round(departmentRisk.risk_score + growthRate + overdueImpact)
      );

      return {
        department: departmentRisk.department,
        predicted_risk: predictedRisk,
        prediction: getPredictionText(predictedRisk),
        trend: {
          recent_pending: trend.recent_pending,
          previous_pending: trend.previous_pending,
          recent_overdue: trend.recent_overdue
        }
      };
    })
    .sort((a, b) => b.predicted_risk - a.predicted_risk);
};

module.exports = {
  getPredictiveRisk
};
