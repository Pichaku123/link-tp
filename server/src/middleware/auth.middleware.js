import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    try {   
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret-for-development");
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired session token." });
    }
};
