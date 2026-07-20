import redis from "../redis.js";

export const rateLimiter = (limit = 20, windowSeconds = 60) => {
    return async (req, res, next) => {
        try {
            const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
            const key = `ratelimit:${ip}`;

            //increase ct for ip    
            const current = await redis.incr(key);
            //if ct is 1, set expiry
            if (current === 1) {
                await redis.expire(key, windowSeconds);
            }
            if (current > limit) {
                return res.status(429).json({ error: "Too many requests. Please try again later." });
            }
            next();
        } catch (err) {
            // Log error but fail open so rate-limiter failure doesn't crash the server
            console.error("Rate limiter error:", err);
            next();
        }
    };
};
