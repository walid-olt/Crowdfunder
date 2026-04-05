import { Router } from "express";
import {
  requireToken,
  authenticate,
  authorize,
  requireSelfOrRoles,
} from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import portfolioController from "../controllers/portfolio.controller.js";
import { investorIdParamsSchema, ownerIdParamsSchema } from "../schemas/investment.schemas.js";

const router: Router = Router();

router.use(requireToken, authenticate);

router.get("/me", portfolioController.getMyPortfolio);
router.get(
  "/investors/:investorId",
  authorize(["ADMIN", "OWNER", "INVESTOR"]),
  validate(investorIdParamsSchema),
  requireSelfOrRoles(["ADMIN", "OWNER"], "investorId"),
  portfolioController.getInvestorPortfolio,
);
router.get(
  "/owners/:ownerId",
  authorize(["ADMIN", "OWNER"]),
  validate(ownerIdParamsSchema),
  requireSelfOrRoles(["ADMIN"], "ownerId"),
  portfolioController.getOwnerPortfolio,
);

export default router;
