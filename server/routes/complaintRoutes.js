const express = require("express");
const router = express.Router();

// Controllers
const {
  addComplaint,
  getComplaints,
  assignCase,
  investigateCase,
  updateStatus,
  answerComplaint,
  deleteComplaint
} = require("../controllers/complaintController");

// Middleware
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");


// ADD COMPLAINT
// POST /api/complaints/add
router.post(
  "/add",
  authMiddleware,
  upload.single("file"),
  addComplaint
);


// GET ALL COMPLAINTS
// GET /api/complaints
router.get(
  "/",
  authMiddleware,
  getComplaints
);


// UPDATE COMPLAINT STATUS
// PUT /api/complaints/status/:id
router.put(
  "/status/:id",
  authMiddleware,
  adminMiddleware,
  updateStatus
);


// ASSIGN CASE
// PUT /api/complaints/assign/:id
router.put(
  "/assign/:id",
  authMiddleware,
  adminMiddleware,
  assignCase
);


// INVESTIGATE CASE
// PUT /api/complaints/investigate/:id
router.put(
  "/investigate/:id",
  authMiddleware,
  adminMiddleware,
  investigateCase
);


// ANSWER COMPLAINT
// PUT /api/complaints/reply/:id
router.put(
  "/reply/:id",
  authMiddleware,
  adminMiddleware,
  answerComplaint
);


// DELETE COMPLAINT
// DELETE /api/complaints/:id
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteComplaint
);


module.exports = router;