import prisma from "../prisma.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

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
        await prisma.url.delete({ where: { id } });
        res.json({ message: "URL deleted successfully." });
    } catch (err) {
        next(err);
    }
};

export const redirectUrl = async (req, res, next) => {
    try {
        const { code } = req.params;
        const urlConfig = await prisma.url.findUnique({ where: { shortCode: code } });
        if (!urlConfig) {
            return res.status(404).json({ error: "URL not found." });
        }

        //expiry check
        if (urlConfig.expiresAt && new Date(urlConfig.expiresAt) < new Date()) {
            return res.status(410).json({ error: "URL has expired." });
        }
    
        //create click record for click analytics
        prisma.click.create({
            data: {
                urlId: urlConfig.id,
                referrer: req.get("referrer") || null,
                userAgent: req.get("user-agent") || null
            }
        }).catch(err => console.error("Error creating click record:", err));

        prisma.url.update({
            where: { id: urlConfig.id },
            data: { clickCount: { increment: 1 } }
        }).catch(err => console.error("Error incrementing click count:", err));

        res.redirect(302, urlConfig.longUrl);       //redirect to the original long url
    } catch (err) {
        next(err);
    }
};
