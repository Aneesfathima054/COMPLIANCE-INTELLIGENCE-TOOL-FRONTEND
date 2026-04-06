import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import AIReportsPanel from "../components/ai/AIReportsPanel";
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

function AdminDashboard() {
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
				setError(err?.response?.data?.message || "Failed to load admin dashboard.");
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
		const unassigned = complaints.filter((item) => !item.assignedTo).length;
		const total = complaints.length;
		const assignedCoverage = total
			? Math.round(((total - unassigned) / total) * 100)
			: 0;

		return {
			total,
			submitted,
			assigned,
			investigating,
			resolved,
			unassigned,
			assignedCoverage,
			unassignedRate: total ? Math.round((unassigned / total) * 100) : 0,
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
								<p className="eyebrow mb-2">Admin command center</p>
								<h1 className="dashboard-title mb-2">Welcome, {user?.name || "Admin"}</h1>
								<p className="dashboard-subtitle mb-0">
									Login, view complaints, assign cases, investigate, update status, and generate reports.
								</p>
								<div className="d-flex flex-wrap gap-2 mt-3">
									<span className="badge text-bg-light">Queue: {summary.total}</span>
									<span className="badge text-bg-light">Unassigned: {summary.unassigned}</span>
									<span className="badge text-bg-light">Operational Dashboard</span>
								</div>
							</div>
							<div className="col-lg-4">
								<div className="hero-mini-card">
									<p className="mb-1 small text-uppercase">Queue Health</p>
									<div className="d-flex justify-content-between small mb-1">
										<span>Resolved</span>
										<span>{summary.resolvedRate}%</span>
									</div>
									<div className="progress mb-2" role="progressbar" aria-label="Resolved rate">
										<div className="progress-bar bg-success" style={{ width: `${summary.resolvedRate}%` }} />
									</div>
									<div className="d-flex justify-content-between small mb-1">
										<span>Unassigned</span>
										<span>{summary.unassignedRate}%</span>
									</div>
									<div className="progress" role="progressbar" aria-label="Unassigned rate">
										<div className="progress-bar bg-warning" style={{ width: `${summary.unassignedRate}%` }} />
									</div>
								</div>
							</div>
						</div>
					</section>

					{error && <div className="alert alert-danger">{error}</div>}

					<div className="row g-3 mb-4">
						<div className="col-6 col-lg-2">
							<div className="stat-card stat-card-1">
								<p>Total</p>
								<h3>{summary.total}</h3>
							</div>
						</div>
						<div className="col-6 col-lg-2">
							<div className="stat-card stat-card-2">
								<p>Submitted</p>
								<h3>{summary.submitted}</h3>
							</div>
						</div>
						<div className="col-6 col-lg-2">
							<div className="stat-card stat-card-4">
								<p>Assigned</p>
								<h3>{summary.assigned}</h3>
							</div>
						</div>
						<div className="col-6 col-lg-2">
							<div className="stat-card stat-card-4">
								<p>Investigating</p>
								<h3>{summary.investigating}</h3>
							</div>
						</div>
						<div className="col-6 col-lg-2">
							<div className="stat-card stat-card-3">
								<p>Resolved</p>
								<h3>{summary.resolved}</h3>
							</div>
						</div>
						<div className="col-6 col-lg-2">
							<div className="stat-card stat-card-1">
								<p>Unassigned</p>
								<h3>{summary.unassigned}</h3>
							</div>
						</div>
					</div>

					<div className="row g-4">
						<div className="col-lg-8">
							<div className="panel-card h-100">
								<div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
									<div>
										<h5 className="mb-1">Recent Cases</h5>
										<p className="compact-note mb-0">Latest 8 complaints for quick action</p>
									</div>
									<Link to="/admin/complaints" className="btn btn-sm btn-outline-primary">
										Open Case Queue
									</Link>
								</div>

								{loading ? (
									<p className="text-muted mb-0">Loading cases...</p>
								) : complaints.length === 0 ? (
									<div className="alert alert-info mb-0">No cases in the queue.</div>
								) : (
									<div className="table-responsive">
										<table className="table table-modern align-middle mb-0">
											<thead>
												<tr>
													<th>Title</th>
													<th>User</th>
													<th>Stage</th>
													<th>Assigned</th>
												</tr>
											</thead>
											<tbody>
												{complaints.slice(0, 8).map((item) => (
													<tr key={item._id}>
														<td>{item.title || "Untitled"}</td>
														<td>{item.userId?.name || "Unknown"}</td>
														<td>
															<span className={`status-pill ${getStatusClass(item.status)}`}>
																{normalizeStatus(item.status)}
															</span>
														</td>
														<td>{item.assignedTo || "Not assigned"}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</div>
						</div>

						<div className="col-lg-4">
							<div className="panel-card panel-card-highlight panel-card-admin h-100">
								<div className="d-flex justify-content-between align-items-start gap-2 mb-3">
									<div>
										<p className="eyebrow mb-1">Operations</p>
										<h5 className="mb-1 text-white">Admin Action Center</h5>
										<p className="panel-highlight-note mb-0">
											Prioritize, assign, and resolve cases from one command card.
										</p>
									</div>
									<span className="insight-pill">
										<i className="bi bi-shield-check me-1" />
										{summary.assignedCoverage}% coverage
									</span>
								</div>

								<div className="row g-2 mb-3">
									<div className="col-6">
										<div className="mini-kpi">
											<p className="mb-1">Open Queue</p>
											<h6 className="mb-0">{summary.total - summary.resolved}</h6>
										</div>
									</div>
									<div className="col-6">
										<div className="mini-kpi">
											<p className="mb-1">Unassigned</p>
											<h6 className="mb-0">{summary.unassigned}</h6>
										</div>
									</div>
								</div>

								<div className="mb-3">
									<div className="d-flex justify-content-between small fw-semibold text-white mb-1">
										<span>Assigned Coverage</span>
										<span>{summary.assignedCoverage}%</span>
									</div>
									<div className="progress progress-soft" role="progressbar" aria-label="Assigned coverage">
										<div
											className="progress-bar"
											style={{ width: `${summary.assignedCoverage}%` }}
										/>
									</div>
								</div>

								<div className="mb-3">
									<div className="d-flex justify-content-between small fw-semibold text-white mb-1">
										<span>Resolution</span>
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
									<Link className="btn btn-light btn-glow" to="/admin/complaints">
										<i className="bi bi-kanban me-1" />
										Manage Cases
									</Link>
									<Link className="btn btn-outline-light" to="/admin/reports">
										<i className="bi bi-file-earmark-bar-graph me-1" />
										Generate Reports
									</Link>
								</div>
							</div>
						</div>
					</div>

					<AIReportsPanel />
				</div>
			</div>
		</>
	);
}

export default AdminDashboard;
