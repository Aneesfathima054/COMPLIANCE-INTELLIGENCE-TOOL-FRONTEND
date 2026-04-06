const fs = require("fs");
const path = require("path");
const pdfParseModule = require("pdf-parse");
const mammoth = require("mammoth");

const parsePdfBuffer = async (fileBuffer) => {
  // pdf-parse v2 exports a PDFParse class.
  if (typeof pdfParseModule.PDFParse === "function") {
    const parser = new pdfParseModule.PDFParse({ data: fileBuffer });

    try {
      const parsed = await parser.getText();
      return parsed?.text || "";
    } finally {
      if (typeof parser.destroy === "function") {
        await parser.destroy();
      }
    }
  }

  // Backward compatibility for pdf-parse v1 function export.
  const legacyParser =
    typeof pdfParseModule === "function"
      ? pdfParseModule
      : pdfParseModule?.default;

  if (typeof legacyParser !== "function") {
    throw new Error(
      "Unsupported pdf-parse export format. Install a compatible pdf-parse version."
    );
  }

  const parsed = await legacyParser(fileBuffer);
  return parsed?.text || "";
};

const REQUIRED_CLAUSES = [
  {
    name: "GDPR",
    keywords: [
      "gdpr",
      "general data protection regulation",
      "personal data",
      "data subject",
      "lawful basis",
      "right to erasure",
      "data protection officer",
      "dpo",
      "data processing"
    ]
  },
  {
    name: "ISO 27001",
    keywords: [
      "iso 27001",
      "information security management",
      "isms",
      "annex a",
      "risk treatment",
      "statement of applicability",
      "soa",
      "security control"
    ]
  },
  {
    name: "Privacy Policy",
    keywords: [
      "privacy policy",
      "privacy notice",
      "personal information",
      "data collection",
      "data retention",
      "cookie policy",
      "third party sharing"
    ]
  },
  {
    name: "Access Control Policy",
    keywords: [
      "access control",
      "least privilege",
      "identity access",
      "role based access",
      "rbac",
      "authentication",
      "authorization",
      "privileged access",
      "mfa"
    ]
  },
  {
    name: "Incident Response Policy",
    keywords: [
      "incident response",
      "security incident",
      "breach response",
      "incident reporting",
      "containment",
      "eradication",
      "recovery plan",
      "forensics",
      "breach notification"
    ]
  }
];

const CONTEXTUAL_COMPLIANCE_SIGNALS = [
  "compliance",
  "regulation",
  "regulatory",
  "policy",
  "act",
  "audit",
  "governance",
  "secretarial",
  "sebi",
  "listing",
  "lodr",
  "filing",
  "disclosure",
  "board",
  "guideline",
  "control",
  "risk"
];

const DOC_UPLOAD_ROOT = path.resolve(__dirname, "..", "..", "uploads");

const normalizeText = (value) => (value || "").toLowerCase();

const resolveSafePath = (filePath) => {
  const candidate = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(__dirname, "..", "..", filePath);

  const resolvedPath = path.resolve(candidate);

  if (!resolvedPath.startsWith(DOC_UPLOAD_ROOT)) {
    throw new Error("File path is outside allowed uploads directory");
  }

  return resolvedPath;
};

const extractTextFromFile = async ({ filePath, mimeType }) => {
  const ext = path.extname(filePath).toLowerCase();

  if (mimeType === "application/pdf" || ext === ".pdf") {
    const fileBuffer = await fs.promises.readFile(filePath);
    return parsePdfBuffer(fileBuffer);
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    const parsed = await mammoth.extractRawText({ path: filePath });
    return parsed.value || "";
  }

  if (mimeType === "text/plain" || ext === ".txt") {
    return fs.promises.readFile(filePath, "utf8");
  }

  throw new Error("Unsupported file type. Only PDF, DOCX, and TXT are allowed.");
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findKeywordHits = (normalized, keywords = []) => {
  const hits = [];

  for (const keyword of keywords) {
    const pattern = new RegExp(`\\b${escapeRegex(keyword).replace(/\\\s\+/g, "\\\\s+")}\\b`, "i");

    if (pattern.test(normalized)) {
      hits.push(keyword);
    }
  }

  return hits;
};

const analyzeText = (text) => {
  const normalized = normalizeText(text);

  const clauseAnalysis = REQUIRED_CLAUSES.map((clause) => {
    const hits = findKeywordHits(normalized, clause.keywords);

    return {
      name: clause.name,
      hits,
      hit_count: hits.length
    };
  });

  const detectedPolicies = clauseAnalysis
    .filter((clause) => clause.hit_count > 0)
    .map((clause) => clause.name);

  const missingPolicies = REQUIRED_CLAUSES.filter(
    (clause) => !detectedPolicies.includes(clause.name)
  ).map((clause) => clause.name);

  const complianceScore = Math.round(
    (detectedPolicies.length / REQUIRED_CLAUSES.length) * 100
  );

  const contextualHits = findKeywordHits(normalized, CONTEXTUAL_COMPLIANCE_SIGNALS);
  const contextualScore = Math.min(85, contextualHits.length * 8);
  const finalScore = Math.max(complianceScore, contextualScore);

  const hasReadableContent = (text || "").trim().length >= 80;
  const hasComplianceSignals = contextualHits.length > 0;

  let recommendation =
    missingPolicies.length > 0
      ? `Add or improve these policy sections: ${missingPolicies.join(", ")}.`
      : "Document includes the required compliance policy clauses.";

  if (!hasReadableContent) {
    recommendation =
      "Document text is too short to assess reliably. Upload a full policy/compliance document with detailed clauses.";
  } else if (!detectedPolicies.length && hasComplianceSignals) {
    recommendation =
      "Document appears compliance-related, but required GDPR/ISO/privacy/access/incident clauses were not explicitly detected. Add these sections for a higher policy score.";
  }

  return {
    compliance_score: finalScore,
    policy_score: complianceScore,
    contextual_score: contextualScore,
    detected_policies: detectedPolicies,
    missing_policies: missingPolicies,
    matched_signals: clauseAnalysis.filter((clause) => clause.hit_count > 0),
    contextual_signals: contextualHits,
    extracted_text_length: (text || "").length,
    recommendation
  };
};

const buildUploadResponse = (file) => ({
  message: "Document uploaded successfully",
  file_name: file.originalname,
  file_type: file.mimetype,
  file_size_bytes: file.size,
  file_path: path.relative(path.resolve(__dirname, "..", ".."), file.path)
});

const analyzeUploadedFile = async (file) => {
  const extractedText = await extractTextFromFile({
    filePath: file.path,
    mimeType: file.mimetype
  });

  const analyzed = analyzeText(extractedText);

  return {
    file_name: file.originalname,
    ...analyzed
  };
};

const analyzeFileByPath = async (unsafePath) => {
  const safePath = resolveSafePath(unsafePath);

  if (!fs.existsSync(safePath)) {
    throw new Error("Document not found");
  }

  const extractedText = await extractTextFromFile({
    filePath: safePath,
    mimeType: ""
  });

  return {
    file_name: path.basename(safePath),
    ...analyzeText(extractedText)
  };
};

module.exports = {
  buildUploadResponse,
  analyzeUploadedFile,
  analyzeFileByPath,
  REQUIRED_CLAUSES
};
