import { Router } from "express";
import {
  requireToken,
  authenticate,
  authorize,
  requireSelf,
  requireSelfOrRoles,
} from "../middleware/auth.js";
import {
  userBalanceUpdateRequestSchema,
  userIdParamsSchema,
} from "../schemas/user.schemas.js";
import { validate } from "../middleware/validate.js";
import userController from "../controllers/user.controller.js";
const router : Router = Router();
router.use(requireToken, authenticate);

router.get(
  "/:userId",
  validate(userIdParamsSchema),
  requireSelfOrRoles(["ADMIN"], "userId"),
  userController.getProfile,
);
router.post(
  "/:userId/balance",
  authorize(["INVESTOR"]),
  validate(userBalanceUpdateRequestSchema),
  requireSelf("userId"),
  userController.updateUserBalance
);
router.get("/", authorize(["ADMIN"]), userController.getAllUsers);


export default router