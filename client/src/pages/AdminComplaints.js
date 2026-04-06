import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
	answerComplaintRequest,
	assignComplaintRequest,
	deleteComplaintRequest,
	getComplaintsRequest,
	investigateComplaintRequest,
	updateComplaintStatusRequest
} from "../services/api";

const STATUS_OPTIONS = ["Submitted", "Assigned", "Investigating", "Resolved"];

const normalizeStatus = (status) => {
	if (status === "Pending") {
		return "Submitted";
	}

	return status || "Submitted";
};

const getStatusClass = (status) => {
	switch (normalizeStatus(status)) {
		case "Assigned":
			return "status-assigned";
		case "Investigating":
			return "status-investigating";
		case "Resolved":
			return "status-resolved";
		default:
			return "status-submitted";
	}
};

const SERVER_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(
	/\/api\/?$/,
	""
);

const buildFileUrl = (filePath) => {
	if (!filePath) {
		return "";
	}

	if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
		return filePath;
	}

	const normalized = filePath.replace(/\\/g, "/").replace(/^\//, "");
	return `${SERVER_BASE}/${normalized}`;
};

function AdminComplaints() {
	const [complaints, setComplaints] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [busyById, setBusyById] = useState({});
	const [assigneeById, setAssigneeById] = useState({});
	const [investigationById, setInvestigationById] = useState({});
	const [replyById, setReplyById] = useState({});

	const summary = useMemo(() => {
		const submitted = complaints.filter((item) => normalizeStatus(item.status) === "Submitted").length;
		const assigned = complaints.filter((item) => normalizeStatus(item.status) === "Assigned").length;
		const investigating = complaints.filter(
			(item) => normalizeStatus(item.status) === "Investigating"
		).length;
		const resolved = complaints.filter((item) => normalizeStatus(item.status) === "Resolved").length;

		return {
			total: complaints.length,
			submitted,
			assigned,
			investigating,
			resolved
		};
	}, [complaints]);

	const setBusy = (id, value) => {
		setBusyById((prev) => ({
			...prev,
			[id]: value
		}));
	};

	const fetchComplaints = async () => {
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			const { data } = await getComplaintsRequest();

			const sorted = [...(Array.isArray(data) ? data : [])].sort(
				(a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
			);

			setComplaints(sorted);
			setAssigneeById((prev) => {
				const next = { ...prev };
				sorted.forEach((item) => {
					next[item._id] = prev[item._id] ?? item.assignedTo ?? "";
				});
				return next;
			});
			setInvestigationById((prev) => {
				const next = { ...prev };
				sorted.forEach((item) => {
					next[item._id] = prev[item._id] ?? item.investigationNotes ?? "";
				});
				return next;
			});
			setReplyById((prev) => {
				const next = { ...prev };
				sorted.forEach((item) => {
					next[item._id] = prev[item._id] ?? item.adminReply ?? "";
				});
				return next;
			});
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to load complaints.");
			setComplaints([]);
		} finally {
			setLoading(false);
		}
	};

	const handleStatusChange = async (id, status) => {
		setBusy(id, true);
		setError("");
		setSuccess("");

		try {
			const { data } = await updateComplaintStatusRequest(id, status);

			setComplaints((prev) => prev.map((item) => (item._id === id ? { ...item, ...data } : item)));
			setSuccess("Status updated.");
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to update status.");
		} finally {
			setBusy(id, false);
		}
	};

	const handleAssign = async (id) => {
		const assignedTo = (assigneeById[id] || "").trim();

		if (!assignedTo) {
			setError("Enter assignee name before assigning.");
			return;
		}

		setBusy(id, true);
		setError("");
		setSuccess("");

		try {
			const { data } = await assignComplaintRequest(id, assignedTo);
			setComplaints((prev) => prev.map((item) => (item._id === id ? { ...item, ...data } : item)));
			setSuccess("Case assigned.");
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to assign case.");
		} finally {
			setBusy(id, false);
		}
	};

	const handleInvestigate = async (id) => {
		const investigationNotes = (investigationById[id] || "").trim();

		if (!investigationNotes) {
			setError("Add investigation notes before updating case.");
			return;
		}

		setBusy(id, true);
		setError("");
		setSuccess("");

		try {
			const { data } = await investigateComplaintRequest(id, investigationNotes);
			setComplaints((prev) => prev.map((item) => (item._id === id ? { ...item, ...data } : item)));
			setSuccess("Investigation notes saved.");
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to update investigation.");
		} finally {
			setBusy(id, false);
		}
	};

	const handleReplyAndResolve = async (id) => {
		const reply = (replyById[id] || "").trim();

		if (!reply) {
			setError("Add admin reply before resolving.");
			return;
		}

		setBusy(id, true);
		setError("");
		setSuccess("");

		try {
			const { data } = await answerComplaintRequest(id, reply, "Resolved");
			setComplaints((prev) => prev.map((item) => (item._id === id ? { ...item, ...data } : item)));
			setSuccess("Reply submitted and case resolved.");
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to submit reply.");
		} finally {
			setBusy(id, false);
		}
	};

	const handleDelete = async (id) => {
		const ok = window.confirm("Are you sure you want to delete this complaint?");
		if (!ok) {
			return;
		}

		setBusy(id, true);
		setError("");
		setSuccess("");

		try {
			await deleteComplaintRequest(id);

			setComplaints((prev) => prev.filter((item) => item._id !== id));
			setSuccess("Complaint deleted.");
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to delete complaint.");
		} finally {
			setBusy(id, false);
		}
	};

	useEffect(() => {
		fetchComplaints();
	}, []);

	return (
		<>
			<Navbar />

			<div className="page-wrap">
				<div className="container">
					<div className="page-head mb-4 d-flex justify-content-between align-items-start flex-wrap gap-3">
						<div>
							<p className="eyebrow mb-2">Admin queue</p>
							<h3 className="mb-1">Admin Complaints</h3>
							<p className="text-muted mb-0">
								Assign officers, add investigation notes, reply to users, and close cases.
							</p>
						</div>
						<div className="d-flex flex-wrap gap-2">
							<span className="badge text-bg-light">Total: {summary.total}</span>
							<span className="badge text-bg-light">Resolved: {summary.resolved}</span>
						</div>
					</div>

					<div className="row g-3 mb-4">
						<div className="col-6 col-lg-3">
							<div className="stat-card stat-card-1">
								<p>Submitted</p>
								<h3>{summary.submitted}</h3>
							</div>
						</div>
						<div className="col-6 col-lg-3">
							<div className="stat-card stat-card-2">
								<p>Assigned</p>
								<h3>{summary.assigned}</h3>
							</div>
						</div>
						<div className="col-6 col-lg-3">
							<div className="stat-card stat-card-4">
								<p>Investigating</p>
								<h3>{summary.investigating}</h3>
							</div>
						</div>
						<div className="col-6 col-lg-3">
							<div className="stat-card stat-card-3">
								<p>Resolved</p>
								<h3>{summary.resolved}</h3>
							</div>
						</div>
					</div>

					<div className="panel-card">
						<div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
							<h5 className="mb-0">Complaint Operations Table</h5>
							<div className="d-flex gap-2">
								<button className="btn btn-outline-primary" onClick={fetchComplaints}>
									Refresh
								</button>
								<Link className="btn btn-primary" to="/admin/reports">
									Generate Reports
								</Link>
							</div>
						</div>

						{error && <div className="alert alert-danger">{error}</div>}
						{success && <div className="alert alert-success">{success}</div>}

						{loading ? (
							<p className="text-muted mb-0">Loading complaints...</p>
						) : complaints.length === 0 ? (
							<div className="alert alert-info mb-0">No complaints found.</div>
						) : (
							<div className="table-responsive">
								<table className="table table-modern table-hover align-middle mb-0">
									<thead>
										<tr>
											<th>Title</th>
											<th>User</th>
											<th>Stage</th>
											<th>Assign Case</th>
											<th>Investigate</th>
											<th>Reply</th>
											<th>File</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{complaints.map((complaint) => {
											const isBusy = Boolean(busyById[complaint._id]);

											return (
												<tr key={complaint._id}>
													<td style={{ minWidth: 220 }}>
														<div className="fw-semibold">{complaint.title || "-"}</div>
														<small className="text-muted">{complaint.description || "-"}</small>
													</td>
													<td>
														{complaint.userId?.name || "Unknown"}
														<br />
														<small className="text-muted">{complaint.userId?.email || "-"}</small>
													</td>
													<td>
														<select
															className="form-select form-select-sm"
															value={normalizeStatus(complaint.status)}
															onChange={(event) =>
																handleStatusChange(complaint._id, event.target.value)
															}
															disabled={isBusy}
														>
															{STATUS_OPTIONS.map((status) => (
																<option key={status} value={status}>
																	{status}
																</option>
															))}
														</select>
															<span className={`status-pill ${getStatusClass(complaint.status)} mt-2`}>
																{normalizeStatus(complaint.status)}
															</span>
														<small className="text-muted d-block mt-1">
															Assigned: {complaint.assignedTo || "Not assigned"}
														</small>
													</td>
													<td style={{ minWidth: 220 }}>
														<input
															type="text"
															className="form-control form-control-sm"
															placeholder="Assign to officer/team"
															value={assigneeById[complaint._id] ?? ""}
															onChange={(event) =>
																setAssigneeById((prev) => ({
																	...prev,
																	[complaint._id]: event.target.value
																}))
															}
															disabled={isBusy}
														/>
														<button
															className="btn btn-sm btn-outline-primary mt-2"
															onClick={() => handleAssign(complaint._id)}
															disabled={isBusy}
														>
															Assign
														</button>
													</td>
													<td style={{ minWidth: 240 }}>
														<textarea
															rows="2"
															className="form-control form-control-sm"
															placeholder="Investigation notes"
															value={investigationById[complaint._id] ?? ""}
															onChange={(event) =>
																setInvestigationById((prev) => ({
																	...prev,
																	[complaint._id]: event.target.value
																}))
															}
															disabled={isBusy}
														/>
														<button
															className="btn btn-sm btn-outline-dark mt-2"
															onClick={() => handleInvestigate(complaint._id)}
															disabled={isBusy}
														>
															Investigate
														</button>
													</td>
													<td style={{ minWidth: 240 }}>
														<textarea
															rows="2"
															className="form-control form-control-sm"
															placeholder="Reply to user"
															value={replyById[complaint._id] ?? ""}
															onChange={(event) =>
																setReplyById((prev) => ({
																	...prev,
																	[complaint._id]: event.target.value
																}))
															}
															disabled={isBusy}
														/>
														<button
															className="btn btn-sm btn-success mt-2"
															onClick={() => handleReplyAndResolve(complaint._id)}
															disabled={isBusy}
														>
															Reply and Resolve
														</button>
													</td>
													<td>
														{complaint.fileUrl ? (
															<a
																href={buildFileUrl(complaint.fileUrl)}
																target="_blank"
																rel="noreferrer"
																className="btn btn-sm btn-outline-secondary"
															>
																View File
															</a>
														) : (
															<span className="text-muted">No file</span>
														)}
													</td>
													<td>
														<button
															className="btn btn-sm btn-danger"
															onClick={() => handleDelete(complaint._id)}
															disabled={isBusy}
														>
															{isBusy ? "Working..." : "Delete"}
														</button>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}

export default AdminComplaints;
