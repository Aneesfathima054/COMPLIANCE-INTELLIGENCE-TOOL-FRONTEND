const TOKEN_KEY = "token";
const USER_KEY = "user";

export const saveAuthData = (token, user) => {
	if (token) {
		localStorage.setItem(TOKEN_KEY, token);
	}

	if (user) {
		localStorage.setItem(USER_KEY, JSON.stringify(user));
	}
};

export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";

export const getUser = () => {
	const raw = localStorage.getItem(USER_KEY);
	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw);
	} catch (error) {
		return null;
	}
};

export const clearAuthData = () => {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => Boolean(getToken());

export const getDashboardPathByRole = (role) =>
	role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";
