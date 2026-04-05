import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { loginRequestSchema, registerRequestSchema } from "../schemas/user.schemas.js";
import { requireToken ,authenticate , authorize } from "../middleware/auth.js";


const router : Router = Router();

router.post("/register", validate(registerRequestSchema), authController.register);

router.post("/login", validate(loginRequestSchema), authController.login);

router.get("/me", requireToken,authenticate, authController.getCurrentUser);

export default router;