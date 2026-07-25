import prisma from "../prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

//auth reused from previous project(clipcode)
export const register = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        
        if (existingUser) return res.status(400).json({ error: "Email is already registered." });
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({ data: { email, passwordHash } });

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: COOKIE_MAX_AGE,
        });

        res.status(201).json({ id: user.id, email: user.email });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: COOKIE_MAX_AGE,
        });

        res.json({ id: user.id, email: user.email });
    } catch (err) {
        next(err);
    }
};

export const logout = async (req, res, next) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });
        res.json({ message: "Logged out successfully." });
    } catch (err) {
        next(err);
    }
};

//check if user is logged in 
export const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        res.json({ id: req.user.id, email: req.user.email });
    } catch (err) {
        next(err);
    }
};
