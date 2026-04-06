import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPathByRole } from "../utils/auth";

function Dashboard() {
	const { user } = useAuth();

	return <Navigate to={getDashboardPathByRole(user?.role)} replace />;
}

export default Dashboard;
