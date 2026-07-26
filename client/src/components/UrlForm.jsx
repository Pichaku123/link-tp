import { useState } from "react";
import api from "../api";

export default function UrlForm({ onSuccess }) {
    const [longUrl, setLongUrl] = useState("");
    const [customAlias, setCustomAlias] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setResult(null);
        setCopied(false);
        setLoading(true);

        try {
            const payload = { longUrl };
            if (customAlias.trim()) payload.customAlias = customAlias.trim();
            if (expiresAt.trim()) {
                payload.expiresAt = new Date(expiresAt).toISOString();
            }

            const res = await api.post("/shorten", payload);
            setResult(res.data);
            setLongUrl("");
            setCustomAlias("");
            setExpiresAt("");
            setShowAdvanced(false);

            if (onSuccess) {
                onSuccess(res.data);
            }
        } catch (err) {
            console.error("Shortening error:", err);
            if (err.response?.data?.details) {
                const detailMsgs = err.response.data.details
                    .map((d) => d.message)
                    .join(", ");
                setError(`Validation error: ${detailMsgs}`);
            } else {
                setError(err.response?.data?.error || "An error occurred while shortening the URL.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
        const shortUrl = `${API_BASE_URL}/${result.shortCode}`;
        
        navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ maxWidth: "650px", margin: "0 auto 2.5rem" }}>
            <form onSubmit={handleSubmit} className="form-card" style={{ padding: "1.75rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label">Shorten a new link</label>
                        <input
                            type="url"
                            className="form-input"
                            placeholder="https://very-long-url.com/path/to/resource..."
                            value={longUrl}
                            onChange={(e) => setLongUrl(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ height: "45px" }}>
                        {loading ? "Shortening..." : "Shorten Link"}
                    </button>
                </div>

                <div style={{ marginTop: "1rem" }}>
                    <div 
                        className="accordion-toggle" 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        <span>{showAdvanced ? "▼" : "▶"} Advanced Settings</span>
                    </div>

                    <div className={`accordion-content ${showAdvanced ? "open" : ""}`}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                                <label className="form-label">Custom Alias (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. my-cool-alias"
                                    value={customAlias}
                                    onChange={(e) => setCustomAlias(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Expiration Date (Optional)</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {error && (
                <div className="error-banner" style={{ marginTop: "1rem" }}>
                    {error}
                </div>
            )}

            {result && (
                <div className="success-banner" style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>Link shortened successfully!</p>
                        <p style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--accent-color)" }}>
                            {`${(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "")}/${result.shortCode}`}
                        </p>
                    </div>
                    <button onClick={handleCopy} className="btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
                        {copied ? "✓ Copied" : "Copy Link"}
                    </button>
                </div>
            )}
        </div>
    );
}
