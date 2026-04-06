import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
	const navigate = useNavigate();
	const { registerUser } = useAuth();

	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: ""
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handleChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");

		const { name, email, password, confirmPassword } = formData;

		if (!name || !email || !password) {
			setError("Please fill all required fields.");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		try {
			setLoading(true);
			await registerUser({ name, email, password });
			setSuccess("Registration successful. Please login.");
			setTimeout(() => navigate("/"), 800);
		} catch (err) {
			setError(err?.response?.data?.message || "Registration failed.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-shell">
			<div className="container auth-container">
				<div className="row g-4 align-items-stretch">
					<div className="col-lg-6">
						<div className="auth-panel h-100">
							<p className="eyebrow mb-2">Compliance Management System</p>
							<h2 className="mb-2">Create Account</h2>
							<p className="text-muted mb-4">Register as a user to submit and track complaints.</p>
							<div className="alert alert-info py-2 small">
								Admin accounts are managed separately and should login from the sign in page.
							</div>

							{error && <div className="alert alert-danger">{error}</div>}
							{success && <div className="alert alert-success">{success}</div>}

							<form onSubmit={handleSubmit}>
								<div className="mb-3">
									<label htmlFor="name" className="form-label">
										Name
									</label>
									<input
										id="name"
										name="name"
										className="form-control"
										placeholder="Enter full name"
										value={formData.name}
										onChange={handleChange}
									/>
								</div>

								<div className="mb-3">
									<label htmlFor="email" className="form-label">
										Email
									</label>
									<input
										id="email"
										name="email"
										type="email"
										className="form-control"
										placeholder="name@company.com"
										value={formData.email}
										onChange={handleChange}
									/>
								</div>

								<div className="mb-3">
									<label htmlFor="password" className="form-label">
										Password
									</label>
									<input
										id="password"
										name="password"
										type="password"
										className="form-control"
										placeholder="Choose a secure password"
										value={formData.password}
										onChange={handleChange}
									/>
								</div>

								<div className="mb-3">
									<label htmlFor="confirmPassword" className="form-label">
										Confirm Password
									</label>
									<input
										id="confirmPassword"
										name="confirmPassword"
										type="password"
										className="form-control"
										placeholder="Repeat your password"
										value={formData.confirmPassword}
										onChange={handleChange}
									/>
								</div>

								<button type="submit" className="btn btn-primary w-100" disabled={loading}>
									{loading ? "Creating..." : "Register"}
								</button>
							</form>

							<p className="mt-3 mb-0 text-center">
								Already have an account? <Link to="/">Login</Link>
							</p>
						</div>
					</div>

					<div className="col-lg-6">
						<div className="auth-side-panel h-100 d-flex flex-column">
							<p className="eyebrow mb-2">Getting Started</p>
							<h3 className="mb-2">Set Up Your Complaint Workspace</h3>
							<p className="mb-3 opacity-75">
								Create your user account and start filing complaints with traceable progress.
							</p>

							<ul className="list-group list-group-flush auth-steps mb-3">
								<li className="list-group-item">Use a valid email address for updates</li>
								<li className="list-group-item">Choose a strong password</li>
								<li className="list-group-item">Submit complaint with optional attachment</li>
								<li className="list-group-item">Track status from your dashboard</li>
							</ul>

							<div className="d-flex flex-wrap gap-2 mt-auto">
								<span className="badge text-bg-light">Secure auth</span>
								<span className="badge text-bg-light">Complaint timeline</span>
								<span className="badge text-bg-light">Status alerts</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Register;
