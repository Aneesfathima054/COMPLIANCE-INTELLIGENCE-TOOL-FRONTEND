const Complaint = require("../models/Complaint");
const mongoose = require("mongoose");
const { inMemoryStore, createId } = require("../utils/inMemoryStore");

const isDbConnected = () => mongoose.connection.readyState === 1;
const WORKFLOW_STATUS = ["Submitted", "Assigned", "Investigating", "Resolved"];
const ALLOWED_STATUS = ["Pending", ...WORKFLOW_STATUS];

const populateComplaintQuery = (query) =>
  query.populate("userId", "name email").populate("repliedBy", "name email");

const toCanonicalStatus = (value) => {
  if (value === "Pending") {
    return "Submitted";
  }

  return value;
};

const sanitizeStatus = (value) => {
  const normalized = toCanonicalStatus((value || "").trim());
  return WORKFLOW_STATUS.includes(normalized) ? normalized : null;
};

const buildStatusUpdate = (status) => {
  const normalizedStatus = sanitizeStatus(status);

  if (!normalizedStatus) {
    return null;
  }

  return {
    status: normalizedStatus,
    resolvedAt: normalizedStatus === "Resolved" ? new Date() : null
  };
};

const mapInMemoryComplaintWithUsers = (item) => {
  const user = inMemoryStore.users.find((u) => u._id === item.userId);
  const repliedBy = inMemoryStore.users.find((u) => u._id === item.repliedBy);

  return {
    ...item,
    userId: user
      ? {
          _id: user._id,
          name: user.name,
          email: user.email
        }
      : null,
    repliedBy: repliedBy
      ? {
          _id: repliedBy._id,
          name: repliedBy.name,
          email: repliedBy.email
        }
      : null
  };
};


// ADD COMPLAINT
exports.addComplaint = async (req, res) => {
  try {
    const title = (req.body?.title || "").trim();
    const description = (req.body?.description || "").trim();

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    if (isDbConnected()) {

      const complaint = await Complaint.create({
        title,
        description,
        fileUrl: req.file ? `uploads/${req.file.filename}` : "",
        status: "Submitted",
        userId: req.user.id
      });

      return res.json(complaint);
    }

    const complaint = {
      _id: createId(),
      title,
      description,
      fileUrl: req.file ? `uploads/${req.file.filename}` : "",
      adminReply: "",
      repliedAt: null,
      resolvedAt: null,
      repliedBy: null,
      status: "Submitted",
      userId: req.user.id,
      createdAt: new Date()
    };

    inMemoryStore.complaints.push(complaint);

    res.json(complaint);

  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to add complaint" });
  }
};


// GET ALL COMPLAINTS
exports.getComplaints = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "ADMIN";

    if (isDbConnected()) {
      const filter = isAdmin ? {} : { userId: req.user.id };

      const complaints = await populateComplaintQuery(
        Complaint.find(filter).sort({ createdAt: -1 })
      );

      return res.json(complaints);
    }

    const complaints = inMemoryStore.complaints
    .filter((item) => isAdmin || item.userId === req.user.id)
    .map(mapInMemoryComplaintWithUsers);

    res.json(complaints);

  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to get complaints" });
  }

};


// ASSIGN CASE
exports.assignCase = async (req, res) => {
  try {
    const assignedTo = (req.body?.assignedTo || "").trim();

    if (!assignedTo) {
      return res.status(400).json({ message: "Assignee name is required" });
    }

    const updateData = {
      assignedTo,
      assignedAt: new Date(),
      status: "Assigned",
      resolvedAt: null
    };

    if (isDbConnected()) {
      const complaint = await populateComplaintQuery(
        Complaint.findByIdAndUpdate(req.params.id, updateData, { new: true })
      );

      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      return res.json(complaint);
    }

    const complaint = inMemoryStore.complaints.find((item) => item._id === req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.assignedTo = updateData.assignedTo;
    complaint.assignedAt = updateData.assignedAt;
    complaint.status = updateData.status;
    complaint.resolvedAt = updateData.resolvedAt;

    res.json(mapInMemoryComplaintWithUsers(complaint));
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to assign case" });
  }
};


// ADD INVESTIGATION NOTES
exports.investigateCase = async (req, res) => {
  try {
    const investigationNotes = (req.body?.investigationNotes || "").trim();

    if (!investigationNotes) {
      return res.status(400).json({ message: "Investigation notes are required" });
    }

    const updateData = {
      investigationNotes,
      investigatedAt: new Date(),
      status: "Investigating",
      resolvedAt: null
    };

    if (isDbConnected()) {
      const complaint = await populateComplaintQuery(
        Complaint.findByIdAndUpdate(req.params.id, updateData, { new: true })
      );

      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      return res.json(complaint);
    }

    const complaint = inMemoryStore.complaints.find((item) => item._id === req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.investigationNotes = updateData.investigationNotes;
    complaint.investigatedAt = updateData.investigatedAt;
    complaint.status = updateData.status;
    complaint.resolvedAt = updateData.resolvedAt;

    res.json(mapInMemoryComplaintWithUsers(complaint));
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update investigation" });
  }
};


// UPDATE STATUS
exports.updateStatus = async (req, res) => {
  try {
    const updateData = buildStatusUpdate(req.body?.status);

    if (!updateData) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (isDbConnected()) {

      const complaint = await populateComplaintQuery(
        Complaint.findByIdAndUpdate(req.params.id, updateData, { new: true })
      );

      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      return res.json(complaint);
    }

    const complaint = inMemoryStore.complaints.find((item) => item._id === req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = updateData.status;
    complaint.resolvedAt = updateData.resolvedAt;

    res.json(complaint);

  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update status" });
  }

};


// ANSWER COMPLAINT AND OPTIONALLY UPDATE STATUS
exports.answerComplaint = async (req, res) => {
  try {
    const reply = (req.body?.reply || "").trim();
    const updateData = buildStatusUpdate(req.body?.status || "Resolved");

    if (!reply) {
      return res.status(400).json({ message: "Reply is required" });
    }

    if (!updateData) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatePayload = {
      adminReply: reply,
      repliedAt: new Date(),
      repliedBy: req.user.id,
      ...updateData
    };

    if (isDbConnected()) {
      const complaint = await populateComplaintQuery(
        Complaint.findByIdAndUpdate(req.params.id, updatePayload, { new: true })
      );

      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      return res.json(complaint);
    }

    const complaint = inMemoryStore.complaints.find((item) => item._id === req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.adminReply = updatePayload.adminReply;
    complaint.repliedAt = updatePayload.repliedAt;
    complaint.repliedBy = updatePayload.repliedBy;
    complaint.status = updatePayload.status;
    complaint.resolvedAt = updatePayload.resolvedAt;

    res.json(mapInMemoryComplaintWithUsers(complaint));
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to answer complaint" });
  }
};


// DELETE COMPLAINT
exports.deleteComplaint = async (req, res) => {

  try {

  if (isDbConnected()) {

    const deletedComplaint = await Complaint.findByIdAndDelete(req.params.id);

    if (!deletedComplaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    return res.json({ message: "Deleted" });
  }

  const index = inMemoryStore.complaints.findIndex((item) => item._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  inMemoryStore.complaints.splice(index, 1);

  res.json({ message: "Deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete complaint" });
  }

};