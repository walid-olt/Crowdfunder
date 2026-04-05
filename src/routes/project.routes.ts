import { Router } from "express";
import { requireToken, authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import projectController from "../controllers/project.controller.js";
import investmentController from "../controllers/investment.controller.js";
import {
  requireProjectOwner,
  requireProjectOwnerOrAdmin,
} from "../middleware/ownership.js";
import {
  createProjectRequestSchema,
  projectIdParamsSchema,
  updateProjectRequestSchema,
} from "../schemas/project.schemas.js";
import { investInProjectRequestSchema } from "../schemas/investment.schemas.js";

const router: Router = Router();

router.use(requireToken, authenticate);

router.get("/open", projectController.listOpenProjects);
router.get("/mine", authorize(["OWNER"]), projectController.listMyProjects);

router.post(
  "/",
  authorize(["OWNER"]),
  validate(createProjectRequestSchema),
  projectController.createProject,
);

router.get(
  "/:projectId",
  validate(projectIdParamsSchema),
  projectController.getProjectById,
);

router.patch(
  "/:projectId",
  authorize(["OWNER"]),
  validate(updateProjectRequestSchema),
  requireProjectOwner,
  projectController.updateProject,
);

router.delete(
  "/:projectId",
  authorize(["OWNER"]),
  validate(projectIdParamsSchema),
  requireProjectOwner,
  projectController.deleteProject,
);

router.post(
  "/:projectId/close",
  authorize(["OWNER"]),
  validate(projectIdParamsSchema),
  requireProjectOwner,
  projectController.closeProject,
);

router.get(
  "/:projectId/cap-table",
  authorize(["OWNER", "ADMIN"]),
  validate(projectIdParamsSchema),
  requireProjectOwnerOrAdmin,
  projectController.getCapTable,
);

router.post(
  "/:projectId/invest",
  authorize(["INVESTOR"]),
  validate(investInProjectRequestSchema),
  investmentController.investInProject,
);

export default router;
