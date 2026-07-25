import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const [isLoginTab, setIsLoginTab] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!isLoginTab && password !== confirmPassword) {
            return setError("Passwords do not match.");
        }

        setLoading(true);
        try {
            if (isLoginTab) {
                await login(email, password);
            } else {
                await register(email, password);
            }
            navigate("/"); // Redirect to Home / Dashboard on success
        } catch (err) {
            console.error("Auth error:", err);
            setError(err.response?.data?.error || "Authentication failed. Check credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-tabs">
                    <button
                        type="button"
                        className={`auth-tab ${isLoginTab ? "active" : ""}`}
                        onClick={() => {
                            setIsLoginTab(true);
                            setError(null);
                        }}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        className={`auth-tab ${!isLoginTab ? "active" : ""}`}
                        onClick={() => {
                            setIsLoginTab(false);
                            setError(null);
                        }}
                    >
                        Create Account
                    </button>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="e.g. devuser@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {!isLoginTab && (
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: "100%", marginTop: "1rem" }}
                        disabled={loading}
                    >
                        {loading ? "Please wait..." : isLoginTab ? "Sign In" : "Register"}
                    </button>
                </form>
            </div>
        </div>
    );
}
