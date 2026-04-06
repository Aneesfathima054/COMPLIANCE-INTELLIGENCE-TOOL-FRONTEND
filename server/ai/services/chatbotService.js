const mongoose = require("mongoose");
const { ComplianceTask } = require("./violationDetector");
const { getRiskAnalysis } = require("./riskAnalyzer");
const { generateComplianceReport } = require("./reportGenerator");
const { detectViolations } = require("./violationDetector");

const isDbConnected = () => mongoose.connection.readyState === 1;

const normalizeText = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesAny = (text, phrases = []) =>
  phrases.some((phrase) => text.includes(phrase));

const includesAllWords = (text, words = []) =>
  words.every((word) => text.includes(word));

const stripGreetingPrefix = (text) =>
  text.replace(
    /^(hi|hello|hey|good morning|good afternoon|good evening)\s*[!,\-:]?\s*/,
    ""
  );

const isPureGreeting = (text) =>
  /^(hi|hello|hey|good morning|good afternoon|good evening|how are you)[!.?\s]*$/.test(text);

const CHAT_SUGGESTIONS = [
  "Which department has highest compliance risk?",
  "Show pending compliance tasks",
  "Show completed compliance tasks",
  "What is the current compliance status?",
  "Show active compliance violations"
];

const getHighestRiskResponse = async () => {
  const riskAnalysis = await getRiskAnalysis();
  const highestRisk = riskAnalysis[0];

  if (!highestRisk) {
    return {
      answer: "No compliance risk data is currently available.",
      data: []
    };
  }

  return {
    answer: `${highestRisk.department} has the highest compliance risk with score ${highestRisk.risk_score}.`,
    data: highestRisk
  };
};

const getRiskOverviewResponse = async () => {
  const riskAnalysis = await getRiskAnalysis();

  if (!riskAnalysis.length) {
    return {
      answer: "No department risk records are available yet.",
      data: []
    };
  }

  const highRiskCount = riskAnalysis.filter((item) => item.risk_level === "High").length;
  const topDepartments = riskAnalysis.slice(0, 3).map((item) => item.department);

  return {
    answer: `Risk overview: ${highRiskCount} high-risk department(s). Top risk departments: ${topDepartments.join(
      ", "
    )}.`,
    data: riskAnalysis
  };
};

const getPendingTasksResponse = async () => {
  if (!isDbConnected()) {
    return {
      answer:
        "Task database is temporarily unavailable, so live pending-task counts cannot be fetched right now.",
      data: []
    };
  }

  const pendingTasks = await ComplianceTask.find(
    { status: /^pending$/i },
    "department task_name status deadline"
  )
    .sort({ deadline: 1 })
    .limit(15)
    .lean();

  return {
    answer: `Found ${pendingTasks.length} pending compliance task(s).`,
    data: pendingTasks
  };
};

const getCompletedTasksResponse = async () => {
  if (!isDbConnected()) {
    return {
      answer:
        "Task database is temporarily unavailable, so live completed-task counts cannot be fetched right now.",
      data: []
    };
  }

  const completedTasks = await ComplianceTask.find(
    { status: /^(completed|resolved|closed|done)$/i },
    "department task_name status deadline"
  )
    .sort({ created_at: -1, deadline: -1 })
    .limit(15)
    .lean();

  return {
    answer: `Found ${completedTasks.length} completed/resolved compliance task(s).`,
    data: completedTasks
  };
};

const getCurrentStatusResponse = async () => {
  const report = await generateComplianceReport({});

  return {
    answer: `Current compliance status: ${report.completed} completed and ${report.pending} pending tasks in period ${report.period}.`,
    data: report
  };
};

const getViolationResponse = async () => {
  const violations = await detectViolations();

  return {
    answer: `Detected ${violations.length} active compliance violation(s).`,
    data: violations
  };
};

const getGreetingResponse = () => ({
  answer:
    "Hello. I can help with compliance risk, pending tasks, violations, and overall status. What would you like to check?",
  data: {
    suggestions: CHAT_SUGGESTIONS
  }
});

const getHelpResponse = () => ({
  answer: `Try one of these: ${CHAT_SUGGESTIONS.join(" | ")}`,
  data: {
    suggestions: CHAT_SUGGESTIONS
  }
});

const getThanksResponse = () => ({
  answer: "You are welcome. Ask any compliance question when you are ready.",
  data: null
});

const getGdprResponse = () => ({
  answer:
    "GDPR (General Data Protection Regulation) is an EU privacy law that controls how organizations collect, use, store, and share personal data. It requires a lawful basis for processing, clear consent where needed, strong security controls, breach reporting, and data subject rights like access, correction, deletion, and portability.",
  data: {
    key_points: [
      "Lawful basis and transparency",
      "Data minimization and purpose limitation",
      "User rights: access, rectification, erasure, portability",
      "Security safeguards and breach notification"
    ]
  }
});

const getIso27001Response = () => ({
  answer:
    "ISO 27001 is an international standard for building an Information Security Management System (ISMS). It helps organizations identify security risks, apply controls, monitor effectiveness, and improve continuously. In practice, teams define policies, perform risk assessments, implement access controls, and run regular internal audits.",
  data: {
    key_points: [
      "Risk-based security management",
      "Documented controls and policies",
      "Continuous monitoring and improvement",
      "Audit readiness and governance"
    ]
  }
});

const getShortAckResponse = () => ({
  answer:
    "Great. Tell me what you want next: pending tasks, completed tasks, highest-risk department, violations, or compliance status.",
  data: {
    suggestions: CHAT_SUGGESTIONS
  }
});

const getGeneralAnswer = (question) => ({
  answer: `I need a little more detail to answer \"${question}\" precisely. Share one of these: regulation/topic, department name, or time period, and I will return a direct result with action steps.`,
  data: {
    suggestions: [
      "Show pending compliance tasks",
      "Show completed compliance tasks",
      "Which department has highest compliance risk?"
    ]
  }
});

const getClarifyingResponse = (question) => {
  if (includesAny(question, ["what", "define", "meaning", "explain"])) {
    return {
      answer:
        "Please specify the exact term you want explained (for example: GDPR, ISO 27001, risk register, DPIA, or incident response).",
      data: null
    };
  }

  if (includesAny(question, ["status", "report", "summary"])) {
    return {
      answer:
        "Do you want overall status, pending tasks, completed tasks, or department risk? I can return it immediately.",
      data: null
    };
  }

  return getGeneralAnswer(question);
};

const getAIChatResponse = async (question = "") => {
  const normalizedQuestion = normalizeText(question || "");

  if (!normalizedQuestion) {
    return getHelpResponse();
  }

  const questionWithoutGreeting = stripGreetingPrefix(normalizedQuestion);
  const effectiveQuestion = questionWithoutGreeting || normalizedQuestion;

  if (includesAny(effectiveQuestion, ["ok", "okay", "yes", "yep", "give", "continue", "go on"])) {
    return getShortAckResponse();
  }

  if (
    includesAny(effectiveQuestion, [
      "gdpr",
      "general data protection regulation",
      "data privacy law",
      "eu privacy law"
    ])
  ) {
    return getGdprResponse();
  }

  if (
    includesAny(effectiveQuestion, [
      "iso27001",
      "iso 27001",
      "isms",
      "information security management system"
    ])
  ) {
    return getIso27001Response();
  }

  if (isPureGreeting(normalizedQuestion)) {
    return getGreetingResponse();
  }

  if (includesAny(effectiveQuestion, ["help", "what can you do", "commands"])) {
    return getHelpResponse();
  }

  if (includesAny(effectiveQuestion, ["thanks", "thank you"])) {
    return getThanksResponse();
  }

  if (effectiveQuestion.includes("highest") && effectiveQuestion.includes("risk")) {
    return getHighestRiskResponse();
  }

  if (
    includesAny(effectiveQuestion, [
      "safety issue",
      "safety issues",
      "breach",
      "non compliance",
      "non compliant",
      "violation",
      "violations",
      "failure",
      "failures"
    ])
  ) {
    return getViolationResponse();
  }

  if (
    includesAny(effectiveQuestion, ["pending task", "pending tasks", "open task", "open tasks", "backlog"]) ||
    includesAllWords(effectiveQuestion, ["pending", "task"]) ||
    includesAllWords(effectiveQuestion, ["pending", "compliance"])
  ) {
    return getPendingTasksResponse();
  }

  if (
    includesAny(effectiveQuestion, [
      "completed task",
      "completed tasks",
      "resolved task",
      "resolved tasks",
      "closed task",
      "closed tasks",
      "done task",
      "done tasks"
    ]) ||
    (includesAny(effectiveQuestion, ["completed", "resolved", "closed", "done"]) &&
      includesAny(effectiveQuestion, ["task", "tasks", "compliance"]))
  ) {
    return getCompletedTasksResponse();
  }

  if (
    includesAny(effectiveQuestion, [
      "current status",
      "compliance status",
      "overall status",
      "status summary",
      "summary"
    ])
  ) {
    return getCurrentStatusResponse();
  }

  if (includesAny(effectiveQuestion, ["risk", "risky", "danger"])) {
    return getRiskOverviewResponse();
  }

  return getClarifyingResponse(effectiveQuestion || question);
};

module.exports = {
  getAIChatResponse
};
