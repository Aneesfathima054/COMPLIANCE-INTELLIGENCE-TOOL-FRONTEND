const { detectViolations } = require("../services/violationDetector");
const { getRiskAnalysis } = require("../services/riskAnalyzer");
const { getPredictiveRisk } = require("../services/predictiveAnalyzer");
const { generateComplianceReport } = require("../services/reportGenerator");
const { getRealtimeAlerts } = require("../services/alertService");
const { getAIChatResponse } = require("../services/chatbotService");
const {
  buildUploadResponse,
  analyzeUploadedFile,
  analyzeFileByPath
} = require("../services/documentAnalyzer");
const {
  getRegulatoryUpdates,
  setLatestComplianceAnalysis
} = require("../services/regulatoryTracker");

exports.getViolations = async (req, res) => {
  try {
    const violations = await detectViolations();

    res.json({
      count: violations.length,
      data: violations
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to detect violations" });
  }
};

exports.getRiskAnalysis = async (req, res) => {
  try {
    const riskAnalysis = await getRiskAnalysis();

    res.json({
      count: riskAnalysis.length,
      data: riskAnalysis
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to compute risk analysis" });
  }
};

exports.getPredictRisk = async (req, res) => {
  try {
    const predictions = await getPredictiveRisk();

    res.json({
      count: predictions.length,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to generate predictions" });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const report = await generateComplianceReport(req.body || {});

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to generate report" });
  }
};

exports.chat = async (req, res) => {
  try {
    const question = req.body?.question || "";
    const response = await getAIChatResponse(question);

    res.json({
      question,
      ...response
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to generate chat response" });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await getRealtimeAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch alerts" });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Document file is required" });
    }

    res.status(201).json(buildUploadResponse(req.file));
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to upload document" });
  }
};

exports.analyzeDocument = async (req, res) => {
  try {
    if (req.file) {
      const result = await analyzeUploadedFile(req.file);
      setLatestComplianceAnalysis(result);
      return res.json(result);
    }

    const filePath = req.body?.file_path || req.body?.filePath;

    if (!filePath) {
      return res.status(400).json({
        message: "Provide a document file or file_path to analyze"
      });
    }

    const result = await analyzeFileByPath(filePath);
    setLatestComplianceAnalysis(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to analyze document" });
  }
};

exports.getRegulatoryUpdates = async (req, res) => {
  try {
    const analysisInput = req.body?.analysis || req.body || null;
    const updates = await getRegulatoryUpdates(analysisInput);
    res.json(updates);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch regulatory updates" });
  }
};
