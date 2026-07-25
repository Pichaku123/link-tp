import { useState, useEffect } from "react";
import api from "../api";

export default function Analytics() {
    const [links, setLinks] = useState([]);
    const [selectedLinkId, setSelectedLinkId] = useState("");
    const [stats, setStats] = useState(null);
    const [loadingLinks, setLoadingLinks] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLinks = async () => {
            setLoadingLinks(true);
            try {
                const res = await api.get("/urls");
                setLinks(res.data);
                if (res.data.length > 0) {
                    setSelectedLinkId(res.data[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch links for analytics:", err);
                setError("Failed to load your link list.");
            } finally {
                setLoadingLinks(false);
            }
        };

        fetchLinks();
    }, []);

    useEffect(() => {
        if (!selectedLinkId) {
            setStats(null);
            return;
        }

        const fetchStats = async () => {
            setLoadingStats(true);
            setError(null);
            try {
                const res = await api.get(`/urls/${selectedLinkId}/stats`);
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch stats:", err);
                setError("Could not load metrics for this link.");
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, [selectedLinkId]);

    const renderProgressBar = (value, total) => {
        const percentage = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.25rem" }}>
                <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ backgroundColor: "var(--accent-color)", width: `${percentage}%`, height: "100%", borderRadius: "4px" }} />
                </div>
                <span style={{ fontSize: "0.85rem", width: "45px", textAlign: "right", color: "var(--text-secondary)" }}>
                    {percentage}%
                </span>
            </div>
        );
    };

    return (
        <div className="main-content" style={{ display: "flex", gap: "2rem", minHeight: "calc(100vh - 160px)" }}>
            <aside style={{ width: "320px", display: "flex", flexDirection: "column", gap: "1rem", borderRight: "1px solid var(--border-color)", paddingRight: "1.5rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Your Short Links</h2>
                {loadingLinks ? (
                    <p style={{ color: "var(--text-secondary)" }}>Loading links...</p>
                ) : links.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>No links created yet.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto", maxHeight: "60vh" }}>
                        {links.map((link) => (
                            <div
                                key={link.id}
                                onClick={() => setSelectedLinkId(link.id)}
                                style={{
                                    backgroundColor: selectedLinkId === link.id ? "rgba(99, 102, 241, 0.1)" : "var(--card-bg)",
                                    border: `1px solid ${selectedLinkId === link.id ? "var(--accent-color)" : "var(--border-color)"}`,
                                    borderRadius: "8px",
                                    padding: "0.85rem 1rem",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <div style={{ fontWeight: 600, color: selectedLinkId === link.id ? "var(--accent-color)" : "var(--text-primary)", wordBreak: "break-all" }}>
                                    {link.shortCode}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {link.longUrl}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </aside>

            <main style={{ flex: 1 }}>
                {error && <div className="error-banner">{error}</div>}

                {loadingStats ? (
                    <p style={{ color: "var(--text-secondary)" }}>Loading metrics...</p>
                ) : !stats ? (
                    <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
                        Select a link from the sidebar to view metrics.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        <div className="form-card" style={{ borderLeft: "4px solid var(--accent-color)" }}>
                            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>
                                /{stats.shortCode}
                            </h1>
                            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "0.5rem", wordBreak: "break-all" }}>
                                Destination: <a href={stats.longUrl} target="_blank" rel="noopener noreferrer">{stats.longUrl}</a>
                            </p>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            <div className="form-card" style={{ textAlign: "center", padding: "2rem" }}>
                                <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600 }}>
                                    Total Redirections
                                </div>
                                <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--accent-color)", marginTop: "0.5rem" }}>
                                    {stats.totalClicks}
                                </div>
                            </div>
                            <div className="form-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "1.5rem 2rem" }}>
                                <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "0.75rem" }}>
                                    Device Type Breakdown
                                </div>
                                {Object.entries(stats.devices).map(([device, count]) => (
                                    <div key={device} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", margin: "0.25rem 0" }}>
                                        <span style={{ fontWeight: 500 }}>{device}</span>
                                        <span style={{ color: "var(--text-secondary)" }}>{count} click{count !== 1 ? "s" : ""}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            <div className="form-card">
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Top Traffic Sources</h3>
                                {Object.keys(stats.referrers).length === 0 ? (
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No click referrals logged yet.</p>
                                ) : (
                                    Object.entries(stats.referrers)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([ref, count]) => (
                                            <div key={ref} style={{ margin: "1rem 0" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                                                    <span style={{ fontWeight: 600, wordBreak: "break-all" }}>{ref}</span>
                                                    <span style={{ color: "var(--text-secondary)" }}>{count}</span>
                                                </div>
                                                {renderProgressBar(count, Object.values(stats.referrers).reduce((a, b) => a + b, 0))}
                                            </div>
                                        ))
                                )}
                            </div>

                            <div className="form-card">
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Browser Distribution</h3>
                                {Object.keys(stats.browsers).length === 0 ? (
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No browser data logged yet.</p>
                                ) : (
                                    Object.entries(stats.browsers)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([browser, count]) => (
                                            <div key={browser} style={{ margin: "1rem 0" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                                                    <span style={{ fontWeight: 600 }}>{browser}</span>
                                                    <span style={{ color: "var(--text-secondary)" }}>{count}</span>
                                                </div>
                                                {renderProgressBar(count, Object.values(stats.browsers).reduce((a, b) => a + b, 0))}
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
