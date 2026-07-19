import { Router } from "express";
import { register, login, logout, getMe } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";

const router = Router();
router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

export default router;
