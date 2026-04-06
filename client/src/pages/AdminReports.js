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

const toCsvCell = (value) => {
	const content = `${value ?? ""}`.replaceAll('"', '""');
	return `"${content}"`;
};

function AdminReports() {
	const [complaints, setComplaints] = useState([]);
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

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
			setError(err?.response?.data?.message || "Failed to load reports.");
			setComplaints([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchComplaints();
	}, []);

	const filteredComplaints = useMemo(() => {
		if (statusFilter === "ALL") {
			return complaints;
		}

		return complaints.filter((item) => normalizeStatus(item.status) === statusFilter);
	}, [complaints, statusFilter]);

	const summary = useMemo(() => {
		const submitted = filteredComplaints.filter(
			(item) => normalizeStatus(item.status) === "Submitted"
		).length;
		const assigned = filteredComplaints.filter(
			(item) => normalizeStatus(item.status) === "Assigned"
		).length;
		const investigating = filteredComplaints.filter(
			(item) => normalizeStatus(item.status) === "Investigating"
		).length;
		const resolved = filteredComplaints.filter(
			(item) => normalizeStatus(item.status) === "Resolved"
		).length;

		return {
			total: filteredComplaints.length,
			submitted,
			assigned,
			investigating,
			resolved
		};
	}, [filteredComplaints]);

	const handleDownloadCsv = () => {
		if (!filteredComplaints.length) {
			return;
		}

		const headers = [
			"Title",
			"User",
			"Email",
			"Status",
			"Assigned To",
			"Investigation Notes",
			"Admin Reply",
			"Created At",
			"Resolved At"
		];

		const rows = filteredComplaints.map((item) => [
			item.title,
			item.userId?.name || "",
			item.userId?.email || "",
			normalizeStatus(item.status),
			item.assignedTo || "",
			item.investigationNotes || "",
			item.adminReply || "",
			item.createdAt ? new Date(item.createdAt).toISOString() : "",
			item.resolvedAt ? new Date(item.resolvedAt).toISOString() : ""
		]);

		const csv = [headers, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.setAttribute("download", `complaint-report-${Date.now()}.csv`);
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
	};

	return (
		<>
			<Navbar />

			<div className="page-wrap">
				<div className="container">
					<div className="page-head mb-4 d-flex justify-content-between align-items-start flex-wrap gap-3">
						<div>
							<p className="eyebrow mb-2">Admin analytics</p>
							<h3 className="mb-1">Admin Reports</h3>
							<p className="text-muted mb-0">Generate complaint summary and CSV exports.</p>
						</div>
						<span className="badge text-bg-light align-self-start">Rows: {filteredComplaints.length}</span>
					</div>

					<div className="panel-card mb-4">
						<div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
							<div>
								<h5 className="mb-1">Report Controls</h5>
								<p className="compact-note mb-0">Filter by status and export current table.</p>
							</div>
							<div className="d-flex align-items-center gap-2">
								<select
									className="form-select"
									value={statusFilter}
									onChange={(event) => setStatusFilter(event.target.value)}
								>
									<option value="ALL">All Statuses</option>
									<option value="Submitted">Submitted</option>
									<option value="Assigned">Assigned</option>
									<option value="Investigating">Investigating</option>
									<option value="Resolved">Resolved</option>
								</select>
								<button className="btn btn-outline-primary" onClick={fetchComplaints}>
									{loading ? "Loading..." : "Load Data"}
								</button>
								<button
									className="btn btn-primary"
									onClick={handleDownloadCsv}
									disabled={!filteredComplaints.length}
								>
									Export CSV
								</button>
							</div>
						</div>
						{error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
					</div>

					<div className="row g-3 mb-4">
						<div className="col-6 col-lg-3">
							<div className="panel-card">
								<p className="text-muted mb-1">Total</p>
								<h4 className="mb-0">{summary.total}</h4>
							</div>
						</div>
						<div className="col-6 col-lg-3">
							<div className="panel-card">
								<p className="text-muted mb-1">Submitted</p>
								<h4 className="mb-0">{summary.submitted}</h4>
							</div>
						</div>
						<div className="col-6 col-lg-3">
							<div className="panel-card">
								<p className="text-muted mb-1">Investigating</p>
								<h4 className="mb-0">{summary.investigating}</h4>
							</div>
						</div>
						<div className="col-6 col-lg-3">
							<div className="panel-card">
								<p className="text-muted mb-1">Resolved</p>
								<h4 className="mb-0">{summary.resolved}</h4>
							</div>
						</div>
					</div>

					<div className="panel-card">
						<h5 className="mb-3">Report Rows</h5>
						{filteredComplaints.length === 0 ? (
							<div className="alert alert-info mb-0">No report data available.</div>
						) : (
							<div className="table-responsive">
								<table className="table table-modern table-hover align-middle mb-0">
									<thead>
										<tr>
											<th>Title</th>
											<th>Status</th>
											<th>Assigned To</th>
											<th>User</th>
											<th>Created</th>
										</tr>
									</thead>
									<tbody>
										{filteredComplaints.map((item) => (
											<tr key={item._id}>
												<td>{item.title || "Untitled"}</td>
												<td>
													<span className={`status-pill ${getStatusClass(item.status)}`}>
														{normalizeStatus(item.status)}
													</span>
												</td>
												<td>{item.assignedTo || "-"}</td>
												<td>{item.userId?.name || "Unknown"}</td>
												<td>
													{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
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

export default AdminReports;
