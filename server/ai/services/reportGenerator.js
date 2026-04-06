const { ComplianceTask } = require("./violationDetector");
const { getRiskAnalysis } = require("./riskAnalyzer");
const Complaint = require("../../models/Complaint");
const mongoose = require("mongoose");
const { inMemoryStore } = require("../../utils/inMemoryStore");

const COMPLETED_STATUSES = ["completed", "resolved", "done", "closed"];
const COMPLAINT_COMPLETED_STATUSES = ["resolved"];
const COMPLAINT_PENDING_STATUSES = ["pending", "submitted", "assigned", "investigating"];

const isDateInPeriod = (date, start, end) => {
  if (!date) {
    return false;
  }

  return date >= start && date < end;
};

const getTaskDate = (task) => task.created_at || task.createdAt || task.deadline || null;
const getComplaintDate = (complaint) => complaint.createdAt || complaint.created_at || null;

const isDbConnected = () => mongoose.connection.readyState === 1;

const getTasksInPeriod = async (start, end) => {
  if (!isDbConnected()) {
    return [];
  }

  const tasks = await ComplianceTask.find(
    {},
    "department status deadline task_name created_at createdAt"
  ).lean();

  if (!start || !end) {
    return tasks;
  }

  return tasks.filter((task) => isDateInPeriod(getTaskDate(task), start, end));
};

const getComplaintsInPeriod = async (start, end) => {
  if (isDbConnected()) {
    const complaints = await Complaint.find({}, "status createdAt assignedTo").lean();

    if (!start || !end) {
      return complaints;
    }

    return complaints.filter((complaint) => isDateInPeriod(getComplaintDate(complaint), start, end));
  }

  const complaints = inMemoryStore.complaints || [];

  if (!start || !end) {
    return complaints;
  }

  return complaints.filter((complaint) => isDateInPeriod(getComplaintDate(complaint), start, end));
};

const buildPeriod = (month, year) => {
  const now = new Date();
  const monthIndex = Number.isInteger(month) ? month - 1 : now.getUTCMonth();
  const periodYear = Number.isInteger(year) ? year : now.getUTCFullYear();

  const start = new Date(Date.UTC(periodYear, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(periodYear, monthIndex + 1, 1, 0, 0, 0));

  return {
    start,
    end,
    label: `${periodYear}-${String(monthIndex + 1).padStart(2, "0")}`
  };
};

const generateComplianceReport = async (payload = {}) => {
  const parsedMonth = Number.parseInt(payload.month, 10);
  const parsedYear = Number.parseInt(payload.year, 10);
  const hasExplicitPeriod = !Number.isNaN(parsedMonth) && !Number.isNaN(parsedYear);

  const { start, end, label } = hasExplicitPeriod
    ? buildPeriod(parsedMonth, parsedYear)
    : {
        start: null,
        end: null,
        label: "All Time"
      };

  const scopedTasks = await getTasksInPeriod(start, end);
  const scopedComplaints = await getComplaintsInPeriod(start, end);

  const hasComplaintDataset = scopedComplaints.length > 0;
  const hasTaskDataset = scopedTasks.length > 0;
  const usingComplaints = hasComplaintDataset || !hasTaskDataset;

  const totalTasks = usingComplaints ? scopedComplaints.length : scopedTasks.length;

  const completed = usingComplaints
    ? scopedComplaints.filter((complaint) =>
        COMPLAINT_COMPLETED_STATUSES.includes((complaint.status || "").toLowerCase())
      ).length
    : scopedTasks.filter((task) => COMPLETED_STATUSES.includes((task.status || "").toLowerCase())).length;

  const pending = usingComplaints
    ? scopedComplaints.filter((complaint) =>
        COMPLAINT_PENDING_STATUSES.includes((complaint.status || "").toLowerCase())
      ).length
    : scopedTasks.filter((task) => (task.status || "").toLowerCase() === "pending").length;

  const complaintStageCounts = usingComplaints
    ? scopedComplaints.reduce(
        (acc, complaint) => {
          const normalizedStatus = (complaint.status || "Unknown").toLowerCase();
          const assignedTo = (complaint.assignedTo || "").toString().trim().toLowerCase();

          if (!assignedTo || assignedTo === "not assigned") {
            acc.unassigned += 1;
          }

          if (normalizedStatus === "resolved") {
            acc.resolved += 1;
          } else if (normalizedStatus === "assigned") {
            acc.assigned += 1;
          } else if (normalizedStatus === "investigating") {
            acc.investigating += 1;
          } else {
            acc.submitted += 1;
          }

          return acc;
        },
        {
          submitted: 0,
          assigned: 0,
          investigating: 0,
          resolved: 0,
          unassigned: 0
        }
      )
    : null;

  const riskAnalysis = await getRiskAnalysis();
  const highRiskDepartments = riskAnalysis
    .filter((item) => item.risk_score > 60)
    .map((item) => item.department);

  const recommendation = highRiskDepartments.length
    ? "Improve compliance monitoring for high-risk departments and enforce proactive deadline tracking."
    : "Maintain current controls and continue weekly monitoring of pending tasks.";

  return {
    title: "Monthly Compliance Summary",
    period: label,
    total_tasks: totalTasks,
    completed,
    pending,
    data_source: usingComplaints ? "complaints_workflow" : "compliance_tasks",
    complaint_stage_counts: complaintStageCounts,
    high_risk_departments: highRiskDepartments,
    recommendation,
    generated_at: new Date().toISOString()
  };
};

module.exports = {
  generateComplianceReport
};
