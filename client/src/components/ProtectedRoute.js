import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPathByRole } from "../utils/auth";

function ProtectedRoute({ children, roles = [] }) {
	const { isAuthenticated, user } = useAuth();

	if (!isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	if (roles.length > 0 && !roles.includes(user?.role)) {
		return <Navigate to={getDashboardPathByRole(user?.role)} replace />;
	}

	return children;
}

export default ProtectedRoute;
