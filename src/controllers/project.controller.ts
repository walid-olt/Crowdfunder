import type { Handler } from "express";
import { catchAsync } from "../middleware/global.js";
import { sendResponse } from "../utils/response.js";
import projectService from "../services/project.service.js";
import type { CreateProjectInput, UpdateProjectInput } from "../schemas/project.schemas.js";

const createProject: Handler = catchAsync(async (req, res) => {
  const ownerId = req.user?.id as string;
  const payload = req.body as CreateProjectInput;

  const project = await projectService.createProject({
    ownerId,
    ...payload,
  });

  return sendResponse(res, 201, project, "Project created successfully");
});

const listOpenProjects: Handler = catchAsync(async (_req, res) => {
  const projects = await projectService.listOpenProjects();
  return sendResponse(res, 200, projects);
});

const getProjectById: Handler = catchAsync(async (req, res) => {
  const projectId = req.params.projectId as string;
  const project = await projectService.getProjectById(projectId);
  return sendResponse(res, 200, project);
});

const listMyProjects: Handler = catchAsync(async (req, res) => {
  const ownerId = req.user?.id as string;
  const projects = await projectService.listOwnerProjects(ownerId);
  return sendResponse(res, 200, projects);
});

const updateProject: Handler = catchAsync(async (req, res) => {
  const ownerId = req.user?.id as string;
  const projectId = req.params.projectId as string;
  const payload = req.body as UpdateProjectInput;

  const project = await projectService.updateProject({
    projectId,
    ownerId,
    ...(payload.title !== undefined && { title: payload.title }),
    ...(payload.description !== undefined && { description: payload.description }),
    ...(payload.targetCapital !== undefined && { targetCapital: payload.targetCapital }),
    ...(payload.maxInvestmentPercentage !== undefined && {
      maxInvestmentPercentage: payload.maxInvestmentPercentage,
    }),
  });

  return sendResponse(res, 200, project, "Project updated successfully");
});

const deleteProject: Handler = catchAsync(async (req, res) => {
  const ownerId = req.user?.id as string;
  const projectId = req.params.projectId as string;

  const deleted = await projectService.deleteProject(projectId, ownerId);
  return sendResponse(res, 200, deleted, "Project deleted successfully");
});

const closeProject: Handler = catchAsync(async (req, res) => {
  const ownerId = req.user?.id as string;
  const projectId = req.params.projectId as string;

  const project = await projectService.closeProject(projectId, ownerId);
  return sendResponse(res, 200, project, "Project closed successfully");
});

const getCapTable: Handler = catchAsync(async (req, res) => {
  const projectId = req.params.projectId as string;
  const result = await projectService.getCapTable(projectId);
  return sendResponse(res, 200, result);
});

export default {
  createProject,
  listOpenProjects,
  getProjectById,
  listMyProjects,
  updateProject,
  deleteProject,
  closeProject,
  getCapTable,
};
