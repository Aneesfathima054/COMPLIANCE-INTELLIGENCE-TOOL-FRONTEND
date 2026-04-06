import React, { createContext, useContext, useMemo, useState } from "react";
import { loginRequest, registerRequest } from "../services/api";
import { clearAuthData, getToken, getUser, saveAuthData } from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [token, setToken] = useState(getToken());
	const [user, setUser] = useState(getUser());

	const loginUser = async (email, password, expectedRole = "") => {
		const payload = { email, password };

		if (expectedRole) {
			payload.role = expectedRole;
		}

		const { data } = await loginRequest(payload);

		if (expectedRole && data?.user?.role !== expectedRole) {
			const error = new Error(
				`This account is ${data?.user?.role || "USER"}. Please choose ${
					data?.user?.role || "USER"
				} and login again.`
			);
			throw error;
		}

		saveAuthData(data.token, data.user);
		setToken(data.token);
		setUser(data.user);
		return data;
	};

	const registerUser = async (payload) => {
		const { data } = await registerRequest(payload);
		return data;
	};

	const logoutUser = () => {
		clearAuthData();
		setToken("");
		setUser(null);
	};

	const value = useMemo(
		() => ({
			token,
			user,
			isAuthenticated: Boolean(token),
			loginUser,
			registerUser,
			logoutUser
		}),
		[token, user]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
