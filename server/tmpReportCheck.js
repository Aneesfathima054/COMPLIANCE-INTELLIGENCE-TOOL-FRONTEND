const { generateComplianceReport } = require("./ai/services/reportGenerator");

(async () => {
  try {
    const report = await generateComplianceReport({});
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error("ERROR", error.message);
  }
})();
