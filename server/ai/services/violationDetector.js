const mongoose = require("mongoose");
const Complaint = require("../../models/Complaint");
const { inMemoryStore } = require("../../utils/inMemoryStore");

const complianceTaskSchema = new mongoose.Schema(
  {
    department: { type: String, default: "Unknown" },
    task_name: { type: String, default: "" },
    status: { type: String, default: "pending" },
    deadline: { type: Date, default: null },
    created_at: { type: Date, default: Date.now }
  },
  {
    collection: "compliance_tasks",
    strict: false,
    versionKey: false
  }
);

const ComplianceTask =
  mongoose.models.ComplianceTask ||
  mongoose.model("ComplianceTask", complianceTaskSchema);

const PENDING_STATUS = "pending";
const FAILURE_STATUSES = [
  "failed",
  "failure",
  "rejected",
  "non-compliant",
  "non_compliant"
];
const COMPLAINT_PENDING_STATUSES = ["pending", "submitted", "assigned", "investigating"];
const COMPLAINT_RESOLVED_STATUS = "resolved";
const MISSED_DEADLINE_DAYS = 7;
const REPEATED_ISSUE_DAYS = 21;

const isDbConnected = () => mongoose.connection.readyState === 1;

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeOwnerBucket = (assignedTo) => {
  const value = (assignedTo || "").toString().trim();
  if (!value || value.toLowerCase() === "not assigned") {
    return "Unassigned";
  }

  return value;
};

const buildMetricsFromComplaints = (complaints = [], referenceDate = new Date()) => {
  const buckets = complaints.reduce((acc, complaint) => {
    const bucket = normalizeOwnerBucket(complaint.assignedTo);
    const status = (complaint.status || "").toLowerCase();
    const createdAt = toDate(complaint.createdAt || complaint.created_at);
    const resolvedAt = toDate(complaint.resolvedAt || complaint.resolved_at);

    if (!acc[bucket]) {
      acc[bucket] = {
        department: bucket,
        total_tasks: 0,
        pending_tasks: 0,
        missed_deadlines: 0,
        repeated_violations: 0
      };
    }

    const row = acc[bucket];
    row.total_tasks += 1;

    const isPending = COMPLAINT_PENDING_STATUSES.includes(status);
    if (isPending) {
      row.pending_tasks += 1;
    }

    if (isPending && createdAt) {
      const ageDays = Math.floor((referenceDate.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000));

      if (ageDays >= MISSED_DEADLINE_DAYS) {
        row.missed_deadlines += 1;
      }

      if (ageDays >= REPEATED_ISSUE_DAYS) {
        row.repeated_violations += 1;
      }
    }

    if (status === COMPLAINT_RESOLVED_STATUS && createdAt && resolvedAt) {
      const cycleDays = Math.floor((resolvedAt.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000));

      if (cycleDays >= REPEATED_ISSUE_DAYS) {
        row.repeated_violations += 1;
      }
    }

    return acc;
  }, {});

  return Object.values(buckets).sort((a, b) => {
    if (b.missed_deadlines !== a.missed_deadlines) {
      return b.missed_deadlines - a.missed_deadlines;
    }

    return b.pending_tasks - a.pending_tasks;
  });
};

const buildDepartmentMetrics = async (referenceDate = new Date()) => {
  if (!isDbConnected()) {
    return buildMetricsFromComplaints(inMemoryStore.complaints || [], referenceDate);
  }

  const metrics = await ComplianceTask.aggregate([
    {
      $project: {
        department: { $ifNull: ["$department", "Unknown"] },
        statusLower: { $toLower: { $ifNull: ["$status", ""] } },
        deadline: "$deadline"
      }
    },
    {
      $group: {
        _id: "$department",
        total_tasks: { $sum: 1 },
        pending_tasks: {
          $sum: {
            $cond: [{ $eq: ["$statusLower", PENDING_STATUS] }, 1, 0]
          }
        },
        missed_deadlines: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$statusLower", PENDING_STATUS] },
                  { $ne: ["$deadline", null] },
                  { $lt: ["$deadline", referenceDate] }
                ]
              },
              1,
              0
            ]
          }
        },
        repeated_violations: {
          $sum: {
            $cond: [{ $in: ["$statusLower", FAILURE_STATUSES] }, 1, 0]
          }
        }
      }
    }
  ]);

  const taskMetrics = metrics
    .map((item) => ({
      department: item._id || "Unknown",
      total_tasks: item.total_tasks || 0,
      pending_tasks: item.pending_tasks || 0,
      missed_deadlines: item.missed_deadlines || 0,
      repeated_violations: item.repeated_violations || 0
    }))
    .sort((a, b) => {
      if (b.missed_deadlines !== a.missed_deadlines) {
        return b.missed_deadlines - a.missed_deadlines;
      }

      return b.pending_tasks - a.pending_tasks;
    });

  if (taskMetrics.length > 0) {
    return taskMetrics;
  }

  const complaints = await Complaint.find({}, "status assignedTo createdAt resolvedAt").lean();
  return buildMetricsFromComplaints(complaints, referenceDate);
};

const detectViolations = async (referenceDate = new Date()) => {
  const metrics = await buildDepartmentMetrics(referenceDate);
  const violations = [];

  metrics.forEach((departmentMetrics) => {
    if (departmentMetrics.missed_deadlines > 0) {
      violations.push({
        department: departmentMetrics.department,
        violation: "Missed Deadline",
        severity: "High",
        evidence_count: departmentMetrics.missed_deadlines
      });
    }

    if (departmentMetrics.pending_tasks > 3) {
      violations.push({
        department: departmentMetrics.department,
        violation: "Too Many Pending Tasks",
        severity: departmentMetrics.pending_tasks > 5 ? "High" : "Medium",
        evidence_count: departmentMetrics.pending_tasks
      });
    }

    if (departmentMetrics.repeated_violations > 1) {
      violations.push({
        department: departmentMetrics.department,
        violation: "Repeated Compliance Failures",
        severity: "High",
        evidence_count: departmentMetrics.repeated_violations
      });
    }
  });

  return violations;
};

module.exports = {
  ComplianceTask,
  PENDING_STATUS,
  FAILURE_STATUSES,
  buildDepartmentMetrics,
  detectViolations
};
