import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPathByRole } from "../utils/auth";

function Login() {
  const navigate = useNavigate();
  const { loginUser, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginAs, setLoginAs] = useState("USER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDashboardPathByRole(user?.role), { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const data = await loginUser(email.trim(), password, loginAs);
      navigate(getDashboardPathByRole(data?.user?.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="container auth-container auth-container-solo">
        <div className="auth-scene">
          <span className="auth-orb auth-orb-a" aria-hidden="true" />
          <span className="auth-orb auth-orb-b" aria-hidden="true" />

          <div className="row justify-content-center">
            <div className="col-xl-7 col-lg-8">
              <div className="auth-panel auth-panel-solo h-100">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <p className="eyebrow mb-0">Compliance Management System</p>
                  <span className="auth-kicker">Secure Access</span>
                </div>

                <h2 className="mb-2">Welcome Back</h2>
                <p className="text-muted mb-4">
                  Sign in to access your compliance workspace, monitor complaints, and act faster.
                </p>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="loginAs" className="form-label">
                      Login As
                    </label>
                    <select
                      id="loginAs"
                      className="form-select"
                      value={loginAs}
                      onChange={(event) => setLoginAs(event.target.value)}
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      id="email"
                      className="form-control"
                      placeholder="name@company.com"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <input
                      id="password"
                      className="form-control"
                      placeholder="Enter your password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>

                <div className="auth-chip-row mt-3">
                  <span className="auth-chip">Role-based access</span>
                  <span className="auth-chip">Real-time tracking</span>
                  <span className="auth-chip">AI-ready dashboard</span>
                </div>

                <p className="compact-note mt-3 mb-0">
                  User flow: register, login, submit complaint, and track status. Admin flow: login,
                  assign, investigate, update status, and generate reports.
                </p>

                <p className="mt-3 mb-0 text-center">
                  New user? <Link to="/register">Create account</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;