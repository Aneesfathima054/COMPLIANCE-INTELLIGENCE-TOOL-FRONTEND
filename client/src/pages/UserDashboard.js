import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
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

const formatDate = (value) => {
	if (!value) {
		return "-";
	}

	return new Date(value).toLocaleString();
};

function UserDashboard() {
	const { user } = useAuth();
	const [complaints, setComplaints] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
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
				setError(err?.response?.data?.message || "Failed to load dashboard data.");
				setComplaints([]);
			} finally {
				setLoading(false);
			}
		};

		fetchComplaints();
	}, []);

	const summary = useMemo(() => {
		const submitted = complaints.filter(
			(item) => normalizeStatus(item.status) === "Submitted"
		).length;
		const assigned = complaints.filter((item) => normalizeStatus(item.status) === "Assigned").length;
		const investigating = complaints.filter(
			(item) => normalizeStatus(item.status) === "Investigating"
		).length;
		const resolved = complaints.filter((item) => normalizeStatus(item.status) === "Resolved").length;
		const inProgress = assigned + investigating;
		const total = complaints.length;

		return {
			total,
			submitted,
			assigned,
			investigating,
			resolved,
			inProgress,
			inProgressRate: total ? Math.round((inProgress / total) * 100) : 0,
			resolvedRate: total ? Math.round((resolved / total) * 100) : 0
		};
	}, [complaints]);

	return (
		<>
			<Navbar />

			<div className="page-wrap">
				<div className="container">
					<section className="dashboard-hero mb-4">
						<div className="row g-3 align-items-end">
							<div className="col-lg-8">
								<p className="eyebrow mb-2">User workspace</p>
								<h1 className="dashboard-title mb-2">Welcome, {user?.name || "User"}</h1>
								<p className="dashboard-subtitle mb-0">
									Register, login, submit complaints, and track every status update in one place.
								</p>
								<div className="d-flex flex-wrap gap-2 mt-3">
									<span className="badge text-bg-light">Total Cases: {summary.total}</span>
									<span className="badge text-bg-light">Live Status Tracking</span>
								</div>
							</div>
							<div className="col-lg-4">
								<div className="hero-mini-card">
									<p className="mb-1 small text-uppercase">Resolution Rate</p>
									<h2 className="mb-2 fw-semibold">{summary.resolvedRate}%</h2>
									<div className="progress" role="progressbar" aria-label="Resolved rate">
										<div className="progress-bar bg-success" style={{ width: `${summary.resolvedRate}%` }} />
									</div>
									<small className="d-block mt-2 opacity-75">
										{summary.resolved} resolved of {summary.total} total complaints
									</small>
								</div>
							</div>
						</div>
					</section>

					{error && <div className="alert alert-danger">{error}</div>}

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

					<div className="row g-4 mb-4">
						<div className="col-lg-8">
							<div className="panel-card h-100">
								<div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
									<div>
										<h5 className="mb-1">Track Complaint Status</h5>
										<p className="compact-note mb-0">Latest 6 cases from your queue</p>
									</div>
									<Link to="/complaints" className="btn btn-sm btn-outline-primary">
										Open Full List
									</Link>
								</div>

								{loading ? (
									<p className="text-muted mb-0">Loading complaints...</p>
								) : complaints.length === 0 ? (
									<div className="alert alert-info mb-0">
										No complaints yet. Submit your first complaint.
									</div>
								) : (
									<div className="table-responsive">
										<table className="table table-modern align-middle mb-0">
											<thead>
												<tr>
													<th>Title</th>
													<th>Status</th>
													<th>Assigned To</th>
													<th>Updated</th>
												</tr>
											</thead>
											<tbody>
												{complaints.slice(0, 6).map((item) => (
													<tr key={item._id}>
														<td>{item.title || "Untitled complaint"}</td>
														<td>
															<span className={`status-pill ${getStatusClass(item.status)}`}>
																{normalizeStatus(item.status)}
															</span>
														</td>
														<td>{item.assignedTo || "Not assigned"}</td>
														<td>{formatDate(item.resolvedAt || item.repliedAt || item.createdAt)}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</div>
						</div>

						<div className="col-lg-4">
							<div className="panel-card panel-card-highlight h-100">
								<div className="d-flex justify-content-between align-items-start gap-2 mb-3">
									<div>
										<p className="eyebrow mb-1">Action desk</p>
										<h5 className="mb-1 text-white">Quick Actions</h5>
										<p className="panel-highlight-note mb-0">
											Keep every complaint moving with fast one-click actions.
										</p>
									</div>
									<span className="insight-pill">
										<i className="bi bi-lightning-charge-fill me-1" />
										{summary.inProgress} active
									</span>
								</div>

								<div className="row g-2 mb-3">
									<div className="col-6">
										<div className="mini-kpi">
											<p className="mb-1">Submitted</p>
											<h6 className="mb-0">{summary.submitted}</h6>
										</div>
									</div>
									<div className="col-6">
										<div className="mini-kpi">
											<p className="mb-1">Resolved</p>
											<h6 className="mb-0">{summary.resolved}</h6>
										</div>
									</div>
								</div>

								<div className="mb-3">
									<div className="d-flex justify-content-between small fw-semibold text-white mb-1">
										<span>In Progress</span>
										<span>{summary.inProgressRate}%</span>
									</div>
									<div className="progress progress-soft" role="progressbar" aria-label="In progress rate">
										<div
											className="progress-bar bg-warning"
											style={{ width: `${summary.inProgressRate}%` }}
										/>
									</div>
								</div>

								<div className="mb-3">
									<div className="d-flex justify-content-between small fw-semibold text-white mb-1">
										<span>Resolved</span>
										<span>{summary.resolvedRate}%</span>
									</div>
									<div className="progress progress-soft" role="progressbar" aria-label="Resolved rate">
										<div
											className="progress-bar bg-success"
											style={{ width: `${summary.resolvedRate}%` }}
										/>
									</div>
								</div>

								<div className="d-grid gap-2 action-stack">
									<Link className="btn btn-light btn-glow" to="/complaints/add">
										<i className="bi bi-plus-circle me-1" />
										Submit Complaint
									</Link>
									<Link className="btn btn-outline-light" to="/complaints">
										<i className="bi bi-search-heart me-1" />
										Track Status
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default UserDashboard;
