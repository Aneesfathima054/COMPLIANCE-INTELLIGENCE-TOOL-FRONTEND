import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPathByRole } from "../utils/auth";

function Navbar() {
	const [isNavOpen, setIsNavOpen] = useState(false);
	const navigate = useNavigate();
	const { user, logoutUser } = useAuth();

	const isAdmin = user?.role === "ADMIN";
	const navItems = isAdmin
		? [
				{ to: "/admin/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
				{ to: "/admin/complaints", label: "View Complaints", icon: "bi-folder2-open" },
				{ to: "/admin/reports", label: "Reports", icon: "bi-bar-chart-line" }
			]
		: [
				{ to: "/user/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
				{ to: "/complaints/add", label: "Submit Complaint", icon: "bi-plus-circle" },
				{ to: "/complaints", label: "Track Status", icon: "bi-clipboard2-check" }
			];

	const handleLogout = () => {
		setIsNavOpen(false);
		logoutUser();
		navigate("/");
	};

	const closeNav = () => {
		setIsNavOpen(false);
	};

	return (
		<nav className="app-navbar navbar navbar-expand-lg">
			<div className="container py-2 py-lg-3">
				<NavLink
					className="brand-mark navbar-brand me-lg-4"
					to={getDashboardPathByRole(user?.role)}
					onClick={closeNav}
				>
					<span className="brand-badge">CMS</span>
					<span>
						ComplianceAI
						<small>Complaint Command Center</small>
					</span>
				</NavLink>

				<button
					className="navbar-toggler"
					type="button"
					aria-controls="appNavigation"
					aria-expanded={isNavOpen}
					aria-label="Toggle navigation"
					onClick={() => setIsNavOpen((prev) => !prev)}
				>
					<span className="navbar-toggler-icon" />
				</button>

				<div className={`collapse navbar-collapse ${isNavOpen ? "show" : ""}`} id="appNavigation">
					<div className="app-nav-links navbar-nav me-auto mb-3 mb-lg-0">
						{navItems.map((item) => (
							<NavLink
								key={item.to}
								className={({ isActive }) =>
									`app-nav-link nav-link${isActive ? " active" : ""}`
								}
								to={item.to}
								onClick={closeNav}
							>
								<i className={`bi ${item.icon} me-1`} aria-hidden="true" />
								{item.label}
							</NavLink>
						))}
					</div>

					<div className="d-flex align-items-center flex-wrap gap-2 ms-lg-3">
						<span className="role-pill">
							<i className={`bi ${isAdmin ? "bi-shield-lock" : "bi-person-circle"} me-1`} />
							{user?.name || "User"} ({user?.role || "USER"})
						</span>
						<button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
							<i className="bi bi-box-arrow-right me-1" aria-hidden="true" />
							Logout
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
}

export default Navbar;
