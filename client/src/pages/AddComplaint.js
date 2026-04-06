import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import FilePreview from "../components/FilePreview";
import { addComplaintRequest } from "../services/api";

function AddComplaint() {
	const navigate = useNavigate();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [file, setFile] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");

		if (!title.trim() || !description.trim()) {
			setError("Title and description are required.");
			return;
		}

		const formData = new FormData();
		formData.append("title", title.trim());
		formData.append("description", description.trim());

		if (file) {
			formData.append("file", file);
		}

		try {
			setLoading(true);
			await addComplaintRequest(formData);

			setSuccess("Complaint submitted successfully.");
			setTitle("");
			setDescription("");
			setFile(null);
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to submit complaint.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Navbar />

			<div className="page-wrap">
				<div className="container">
					<div className="page-head mb-4 d-flex justify-content-between align-items-start flex-wrap gap-3">
						<div>
							<p className="eyebrow mb-2">User actions</p>
							<h3 className="mb-1">Submit New Complaint</h3>
							<p className="text-muted mb-0">
								Share clear details so admins can investigate quickly.
							</p>
						</div>
						<button className="btn btn-outline-primary" onClick={() => navigate("/complaints")}>
							View Complaints
						</button>
					</div>

					<div className="row g-4">
						<div className="col-lg-8">
							<div className="panel-card h-100">
								{error && <div className="alert alert-danger">{error}</div>}
								{success && <div className="alert alert-success">{success}</div>}

								<form onSubmit={handleSubmit}>
									<div className="mb-3">
										<label htmlFor="title" className="form-label">
											Complaint Title
										</label>
										<input
											id="title"
											className="form-control"
											placeholder="Example: Delay in policy approval"
											value={title}
											onChange={(event) => setTitle(event.target.value)}
										/>
									</div>

									<div className="mb-3">
										<label htmlFor="description" className="form-label">
											Description
										</label>
										<textarea
											id="description"
											rows="5"
											className="form-control"
											placeholder="Describe the complaint with relevant details."
											value={description}
											onChange={(event) => setDescription(event.target.value)}
										/>
									</div>

									<div className="mb-3">
										<label htmlFor="file" className="form-label">
											Attachment (optional)
										</label>
										<input
											id="file"
											type="file"
											className="form-control"
											onChange={(event) => setFile(event.target.files?.[0] || null)}
										/>
									</div>

									<FilePreview file={file} />

									<button type="submit" className="btn btn-primary mt-3" disabled={loading}>
										{loading ? "Submitting..." : "Submit Complaint"}
									</button>
								</form>
							</div>
						</div>

						<div className="col-lg-4">
							<div className="panel-card h-100">
								<h5 className="mb-3">Submission Checklist</h5>
								<ol className="workflow-list mb-3">
									<li>Use a specific title</li>
									<li>Describe key timeline and impact</li>
									<li>Attach screenshots or files if needed</li>
									<li>Submit and monitor updates</li>
								</ol>
								<div className="alert alert-warning py-2 mb-0 small">
									Avoid sensitive personal data in public attachments.
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default AddComplaint;
