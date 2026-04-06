const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const authMiddleware = require("../../middleware/authMiddleware");
const adminMiddleware = require("../../middleware/adminMiddleware");
const aiController = require("../controllers/aiController");

const router = express.Router();

const AI_DOC_UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "ai-docs");
fs.mkdirSync(AI_DOC_UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AI_DOC_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const cleanedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${cleanedName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();

    if (!ALLOWED_MIME_TYPES.has(file.mimetype) && !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error("Unsupported file type. Use PDF, DOCX, or TXT."));
    }

    cb(null, true);
  }
});

// Protect all AI endpoints with existing auth + admin middleware.
router.use(authMiddleware, adminMiddleware);

router.get("/violations", aiController.getViolations);
router.get("/risk-analysis", aiController.getRiskAnalysis);
router.get("/predict-risk", aiController.getPredictRisk);
router.post("/generate-report", aiController.generateReport);
router.post("/chat", aiController.chat);
router.get("/alerts", aiController.getAlerts);
router.post("/upload-document", upload.single("document"), aiController.uploadDocument);
router.post("/analyze-document", upload.single("document"), aiController.analyzeDocument);
router.get("/regulatory-updates", aiController.getRegulatoryUpdates);
router.post("/regulatory-updates", aiController.getRegulatoryUpdates);

module.exports = router;
