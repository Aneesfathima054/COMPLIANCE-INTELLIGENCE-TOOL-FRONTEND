import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { getComplaintsRequest } from "../services/api";

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

function ComplaintList() {
	const [complaints, setComplaints] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

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

	const fetchComplaints = async () => {
		setLoading(true);
		setError("");

		try {
			const { data } = await getComplaintsRequest();

			const sorted = [...(Array.isArray(data) ? data : [])].sort(
				(a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
			);

			setComplaints(sorted);
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to load complaints.");
			setComplaints([]);
		} finally {
			setLoading(false);
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
							<p className="eyebrow mb-2">Complaint tracker</p>
							<h3 className="mb-1">My Complaints</h3>
							<p className="text-muted mb-0">Monitor assignments, investigation notes, and admin replies.</p>
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
							<h5 className="mb-0">Complaint Timeline</h5>
							<button className="btn btn-outline-primary" onClick={fetchComplaints}>
								Refresh
							</button>
						</div>

						{error && <div className="alert alert-danger">{error}</div>}

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
											<th>Stage</th>
											<th>Case Progress</th>
											<th>Admin Reply</th>
											<th>Created</th>
											<th>File</th>
										</tr>
									</thead>
									<tbody>
										{complaints.map((complaint) => (
											<tr key={complaint._id}>
												<td style={{ minWidth: 220 }}>
													<div className="fw-semibold">{complaint.title || "-"}</div>
													<small className="text-muted">{complaint.description || "-"}</small>
												</td>
												<td>
													<span className={`status-pill ${getStatusClass(complaint.status)}`}>
														{normalizeStatus(complaint.status)}
													</span>
												</td>
												<td style={{ minWidth: 220 }}>
													<div>
														<small className="text-muted">Assigned To:</small>
														<div>{complaint.assignedTo || "Not assigned yet"}</div>
													</div>
													<div className="mt-1">
														<small className="text-muted">Investigation:</small>
														<div>{complaint.investigationNotes || "Waiting for investigation"}</div>
													</div>
												</td>
												<td style={{ minWidth: 220 }}>
													{complaint.adminReply ? (
														<>
															<div>{complaint.adminReply}</div>
															{complaint.repliedAt && (
																<small className="text-muted">
																	{new Date(complaint.repliedAt).toLocaleString()}
																</small>
															)}
														</>
													) : (
														<span className="text-muted">No reply yet</span>
													)}
												</td>
												<td>
													{complaint.resolvedAt
														? new Date(complaint.resolvedAt).toLocaleString()
														: complaint.createdAt
															? new Date(complaint.createdAt).toLocaleString()
															: "-"}
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
											</tr>
										))}
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

export default ComplaintList;
