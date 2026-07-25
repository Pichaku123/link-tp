import prisma from "../prisma.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import redis from "../redis.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";

export const shorten = async (req, res, next) => {
    try {
        const { longUrl, customAlias, expiresAt } = req.body;

        let userId = null;
        const token = req.cookies.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
            } catch (err) {}
        }

        //custom alias for url
        if (customAlias) {
            const existing = await prisma.url.findUnique({ where: { shortCode: customAlias } });
            if (existing) {
                return res.status(409).json({ error: "Custom alias is already in use." });
            }
            
            const url = await prisma.url.create({
                data: {
                    shortCode: customAlias,
                    longUrl,
                    userId,
                    expiresAt: expiresAt ? new Date(expiresAt) : null
                }
            });
            return res.status(201).json(url);
        }

        let attempts = 0;
        let shortCode;
        let url;

        while (attempts < 3) {
            try {
                shortCode = nanoid(7);
                url = await prisma.url.create({
                    data: {
                        shortCode,
                        longUrl,
                        userId,
                        expiresAt: expiresAt ? new Date(expiresAt) : null   //sent from frontend
                    }
                });
                break;
            } catch (err) {
                if (err.code === "P2002") {
                    attempts++;
                    if (attempts >= 3) return next(err);
                } else {
                    return next(err);
                }
            }
        }

        res.status(201).json(url);
    } catch (err) {
        next(err);
    }
};

export const listUrls = async (req, res, next) => {
    try {
        const urls = await prisma.url.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" }
        });
        res.json(urls);
    } catch (err) {
        next(err);
    }
};

export const deleteUrl = async (req, res, next) => {
    try {
        const { id } = req.params;
        const urlConfig = await prisma.url.findUnique({ where: { id } });
        if (!urlConfig) {
            return res.status(404).json({ error: "URL not found." });
        }
        if (urlConfig.userId !== req.user.id) {
            return res.status(403).json({ error: "Forbidden. You do not own this URL." });
        }

        //delete from DB and Redis
        await prisma.url.delete({ where: { id } });
        await redis.del(`url:${urlConfig.shortCode}`);
        await redis.del(`clicks:${urlConfig.shortCode}`);
        await redis.srem("pending:clicks", urlConfig.shortCode);

        res.json({ message: "URL deleted successfully." });
    } catch (err) {
        next(err);
    }
};

export const redirectUrl = async (req, res, next) => {
    try {
        const { code } = req.params;
        const cacheKey = `url:${code}`;

        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            const cachedUrl = JSON.parse(cachedData);

            //Expiry check
            if (cachedUrl.expiresAt && new Date(cachedUrl.expiresAt) < new Date()) {
                return res.status(410).json({ error: "URL has expired." });
            }

            await redis.incr(`clicks:${code}`);
            await redis.sadd("pending:clicks", code);

            //Used for analytics 
            prisma.click.create({ 
                data: {
                    urlId: cachedUrl.id,
                    referrer: req.get("referrer") || null,
                    userAgent: req.get("user-agent") || null
                }
            }).catch(err => console.error("Error creating click record:", err));

            return res.redirect(302, cachedUrl.longUrl);
        }

        //Cache miss- use db
        const urlConfig = await prisma.url.findUnique({ where: { shortCode: code } });
        if (!urlConfig) {
            return res.status(404).json({ error: "URL not found." });
        }

        if (urlConfig.expiresAt && new Date(urlConfig.expiresAt) < new Date()) {
            return res.status(410).json({ error: "URL has expired." });
        }

        let ttl = 3600; // default = 1 hour
        if (urlConfig.expiresAt) {
            const remainingMs = new Date(urlConfig.expiresAt).getTime() - Date.now();
            const remainingSec = Math.floor(remainingMs / 1000);
            if (remainingSec > 0) {
                ttl = Math.min(3600, remainingSec);
            }
        }

        const cacheValue = JSON.stringify({
            id: urlConfig.id,
            longUrl: urlConfig.longUrl,
            expiresAt: urlConfig.expiresAt
        });
        await redis.set(cacheKey, cacheValue, "EX", ttl);

        await redis.incr(`clicks:${code}`);
        await redis.sadd("pending:clicks", code);

        prisma.click.create({
            data: {
                urlId: urlConfig.id,
                referrer: req.get("referrer") || null,
                userAgent: req.get("user-agent") || null
            }
        }).catch(err => console.error("Error creating click record:", err));

        res.redirect(302, urlConfig.longUrl);
    } catch (err) {
        next(err);
    }
};

export const getUrlStats = async (req, res, next) => {
    try {
        const { id } = req.params;
        const urlConfig = await prisma.url.findUnique({
            where: { id },
            include: {
                clicks: true
            }
        });

        if (!urlConfig) {
            return res.status(404).json({ error: "URL not found." });
        }

        if (urlConfig.userId !== req.user.id) {
            return res.status(403).json({ error: "Forbidden. You do not own this URL." });
        }

        const totalClicks = urlConfig.clickCount;
        
        // Group referrers, browsers, and devices
        const referrers = {};
        const devices = { Desktop: 0, Mobile: 0, Tablet: 0, Unknown: 0 };
        const browsers = {};

        urlConfig.clicks.forEach(click => {
            // Referrers
            let ref = "Direct / Email";
            if (click.referrer) {
                try {
                    ref = new URL(click.referrer).hostname;
                } catch (e) {
                    ref = click.referrer;
                }
            }
            referrers[ref] = (referrers[ref] || 0) + 1;

            // Simple Device classification
            const ua = click.userAgent || "";
            if (/mobile|iphone|ipod|android/i.test(ua)) {
                devices.Mobile++;
            } else if (/tablet|ipad/i.test(ua)) {
                devices.Tablet++;
            } else if (ua === "") {
                devices.Unknown++;
            } else {
                devices.Desktop++;
            }

            // Browser classification
            let browser = "Unknown";
            if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua)) browser = "Chrome";
            else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
            else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Safari";
            else if (/edge|edg/i.test(ua)) browser = "Edge";
            browsers[browser] = (browsers[browser] || 0) + 1;
        });

        res.json({
            id: urlConfig.id,
            shortCode: urlConfig.shortCode,
            longUrl: urlConfig.longUrl,
            totalClicks,
            referrers,
            devices,
            browsers
        });
    } catch (err) {
        next(err);
    }
};

//periodically move click data from redis to postgres
const FLUSH_INTERVAL = 60000; 

async function flushClicks() {
    try {
        const shortCodes = await redis.smembers("pending:clicks");
        if (shortCodes.length === 0) return;

        console.log(`Flushing click counts for ${shortCodes.length} URLs...`);

        for (const shortCode of shortCodes) {
            const clickKey = `clicks:${shortCode}`;
            const countStr = await redis.get(clickKey);
            if (!countStr) continue;

            const incrementValue = parseInt(countStr, 10);
            if (isNaN(incrementValue) || incrementValue <= 0) continue;

            try {
                await prisma.url.update({
                    where: { shortCode },
                    data: { clickCount: { increment: incrementValue } }
                });

                //decrement in redis as db has been updated already
                const remaining = await redis.decrby(clickKey, incrementValue);
                if (remaining <= 0) {
                    await redis.del(clickKey);
                    await redis.srem("pending:clicks", shortCode); 
                }
            } catch (err) {
                console.error(`Failed to flush clicks for ${shortCode} to database:`, err);
            }
        }
    } catch (err) {
        console.error("Error in click flusher:", err);
    }
}

setInterval(flushClicks, FLUSH_INTERVAL);
