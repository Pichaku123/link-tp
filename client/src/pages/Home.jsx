import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import UrlForm from "../components/UrlForm";

export default function Home() {
    const { user } = useAuth();
    const [links, setLinks] = useState([]);
    const [sessionLinks, setSessionLinks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);

    const fetchUserLinks = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.get("/urls");
            setLinks(res.data);
        } catch (err) {
            console.error("Failed to load user links:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserLinks();
    }, [user]);

    const handleShortenSuccess = (newLink) => {
        if (user) {
            fetchUserLinks();
        } else if (newLink) {
            setSessionLinks((prev) => [newLink, ...prev]);
        }
    };

    const handleCopy = (shortCode, index, isSession = false) => {
        const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
        const shortUrl = `${API_BASE_URL}/${shortCode}`;
        navigator.clipboard.writeText(shortUrl);
        
        setCopiedIndex(`${isSession ? "session" : "db"}-${index}`);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this link?")) return;
        try {
            await api.delete(`/urls/${id}`);
            fetchUserLinks();
        } catch (err) {
            console.error("Failed to delete link:", err);
            alert("Error deleting link: " + (err.response?.data?.error || err.message));
        }
    };

    const displayedLinks = user ? links : sessionLinks;

    return (
        <div className="main-content">
            <header className="text-center" style={{ margin: "3rem 0 2rem" }}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                    LinkTP URL Shortener
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
                    Your links, shortened in milliseconds. Every click, tracked in real time."
                </p>
            </header>

            <UrlForm 
                onSuccess={(newLink) => {
                    handleShortenSuccess(newLink);
                }} 
            />

            <section style={{ marginTop: "4rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                    Active Links
                </h2>

                {loading ? (
                    <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>Loading links...</p>
                ) : displayedLinks.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>
                        No active links found. Paste a URL above to get started.
                    </p>
                ) : (
                    <div className="links-grid">
                        {displayedLinks.map((link, idx) => {
                            const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
                            const shortUrl = `${API_BASE_URL}/${link.shortCode}`;
                            const isCopied = copiedIndex === `${user ? "db" : "session"}-${idx}`;

                            return (
                                <div className="link-card" key={link.id || idx}>
                                    <div className="link-card-header">
                                        <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="short-url">
                                            {link.shortCode}
                                        </a>
                                        <span className="clicks-badge">
                                            {link.clickCount} clicks
                                        </span>
                                    </div>
                                    <p className="long-url" title={link.longUrl}>
                                        {link.longUrl}
                                    </p>
                                    <div className="link-card-actions">
                                        <span className="expiry-text">
                                            {link.expiresAt 
                                                ? `Expires: ${new Date(link.expiresAt).toLocaleDateString()}` 
                                                : "Never expires"
                                            }
                                        </span>
                                        <div className="action-buttons">
                                            <button 
                                                onClick={() => handleCopy(link.shortCode, idx, !user)} 
                                                className="btn-icon"
                                                title="Copy Link"
                                            >
                                                {isCopied ? "✓" : "📋"}
                                            </button>
                                            {user && (
                                                <button 
                                                    onClick={() => handleDelete(link.id)} 
                                                    className="btn-icon btn-delete"
                                                    title="Delete Link"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!user ? (
                    <Link to="/auth" className="btn-load-more">
                        Login to store and view your links
                    </Link>
                ) : (
                    links.length > displayedLinks.length && (
                        <button className="btn-load-more">
                            Load More Links
                        </button>
                    )
                )}
            </section>
        </div>
    );
}
