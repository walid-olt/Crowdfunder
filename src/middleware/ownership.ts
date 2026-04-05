import type { RequestHandler } from "express";
import { catchAsync } from "./global.js";
import { projectRepository } from "../repositories/project.repo.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

export const requireProjectOwner: RequestHandler = catchAsync(
  async (req, _res, next) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError("Unauthorized");

    const projectId = req.params.projectId as string | undefined;
    if (!projectId) throw new ForbiddenError("Missing projectId");

    const project = await projectRepository.findByIdOrThrow(projectId);

    if (String(project.ownerId) !== user.id) {
      throw new ForbiddenError("You do not own this project");
    }

    next();
  },
);

export const requireProjectOwnerOrAdmin: RequestHandler = catchAsync(
  async (req, _res, next) => {
    const user = req.user;
    if (!user) throw new UnauthorizedError("Unauthorized");

    if (user.role === "ADMIN") {
      return next();
    }

    const projectId = req.params.projectId as string | undefined;
    if (!projectId) throw new ForbiddenError("Missing projectId");

    const project = await projectRepository.findByIdOrThrow(projectId);

    if (String(project.ownerId) !== user.id) {
      throw new ForbiddenError("You do not own this project");
    }

    next();
  },
);
