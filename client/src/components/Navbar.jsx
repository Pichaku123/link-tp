import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <img src="/vite.svg" alt="Vite Logo" className="navbar-logo" />
                <span>Link-TP</span>
            </Link>

            <div className="navbar-nav">
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
                    Home
                </NavLink>
                {user && (
                    <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                        Analytics
                    </NavLink>
                )}
            </div>

            <div className="navbar-user">
                {user ? (
                    <>
                        <span className="user-email">👤 {user.email}</span>
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <span className="user-email">Guest Mode</span>
                        <Link to="/auth" className="btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.875rem" }}>
                            Login
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
