import { projectRepository } from "../repositories/project.repo.js";
import investmentRepository from "../repositories/investment.repo.js";
import UserRepo from "../repositories/user.repo.js";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../utils/errors.js";

export type CreateProjectPayload = {
  ownerId: string;
  title: string;
  description: string;
  targetCapital: number;
  ownerInvestment?: number;
  maxInvestmentPercentage?: number;
};

export type UpdateProjectPayload = {
  projectId: string;
  ownerId: string;
  title?: string;
  description?: string;
  targetCapital?: number;
  maxInvestmentPercentage?: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const createProject = async (payload: CreateProjectPayload) => {
  const owner = await UserRepo.findById(payload.ownerId);
  if (!owner) throw new NotFoundError("Owner not found");
  if (owner.role !== "OWNER") throw new ForbiddenError("Only project owners can create projects");

  const ownerInvestment = payload.ownerInvestment ?? 0;
  if (ownerInvestment < 0) throw new BadRequestError("ownerInvestment must be >= 0");
  if (ownerInvestment > payload.targetCapital) {
    throw new BadRequestError("ownerInvestment cannot exceed targetCapital");
  }

  const maxInvestmentPercentage = payload.maxInvestmentPercentage ?? 50;

  const status = ownerInvestment >= payload.targetCapital ? "CLOSED" : "OPEN";

  const project = await projectRepository.create({
    title: payload.title,
    description: payload.description,
    targetCapital: payload.targetCapital,
    currentCapital: ownerInvestment,
    ownerId: owner._id,
    status,
    maxInvestmentPercentage,
    ownerInvestment,
  });

  return project;
};

const listOpenProjects = async () => {
  const projects = await projectRepository.findOpenProjects();
  return projects.map((project) => ({
    ...project.toObject(),
    percentageFunded:
      project.targetCapital > 0
        ? round2((project.currentCapital / project.targetCapital) * 100)
        : 0,
  }));
};

const getProjectById = async (projectId: string) => {
  return await projectRepository.findByIdOrThrow(projectId);
};

const listOwnerProjects = async (ownerId: string) => {
  const projects = await projectRepository.findByOwnerId(ownerId);
  return projects.map((project) => ({
    ...project.toObject(),
    percentageFunded:
      project.targetCapital > 0
        ? round2((project.currentCapital / project.targetCapital) * 100)
        : 0,
  }));
};

const updateProject = async (payload: UpdateProjectPayload) => {
  const project = await projectRepository.findByIdOrThrow(payload.projectId);

  if (String(project.ownerId) !== payload.ownerId) {
    throw new ForbiddenError("You do not own this project");
  }

  if (project.status !== "OPEN") {
    throw new ConflictError("Only OPEN projects can be updated");
  }

  if (
    payload.targetCapital !== undefined &&
    payload.targetCapital < project.currentCapital
  ) {
    throw new BadRequestError("targetCapital cannot be less than currentCapital");
  }

  const updated = await projectRepository.updateByOwnerIfOpen(payload.projectId, payload.ownerId, {
    ...(payload.title !== undefined && { title: payload.title }),
    ...(payload.description !== undefined && { description: payload.description }),
    ...(payload.targetCapital !== undefined && { targetCapital: payload.targetCapital }),
    ...(payload.targetCapital !== undefined && payload.targetCapital === project.currentCapital
      ? { status: "CLOSED" }
      : {}),
    ...(payload.maxInvestmentPercentage !== undefined && {
      maxInvestmentPercentage: payload.maxInvestmentPercentage,
    }),
  });

  if (!updated) {
    throw new ConflictError("Project cannot be updated");
  }

  return updated;
};

const deleteProject = async (projectId: string, ownerId: string) => {
  const project = await projectRepository.findByIdOrThrow(projectId);

  if (String(project.ownerId) !== ownerId) {
    throw new ForbiddenError("You do not own this project");
  }

  if (project.status !== "OPEN") {
    throw new ConflictError("Only OPEN projects can be deleted");
  }

  const deleted = await projectRepository.deleteByOwnerIfOpen(projectId, ownerId);
  if (!deleted) {
    throw new ConflictError("Project cannot be deleted");
  }

  await investmentRepository.deleteByProjectId(projectId);

  return deleted;
};

const closeProject = async (projectId: string, ownerId: string) => {
  const project = await projectRepository.findByIdOrThrow(projectId);

  if (String(project.ownerId) !== ownerId) {
    throw new ForbiddenError("You do not own this project");
  }

  if (project.status === "CLOSED") {
    throw new ConflictError("Project is already CLOSED");
  }

  return await projectRepository.updateProjectStatus(projectId, "CLOSED");
};

const getCapTable = async (projectId: string) => {
  const project = await projectRepository.findByIdOrThrow(projectId);

  const rows = await investmentRepository.getCapTableByProjectId(projectId);

  const withPct = rows.map((row: any) => ({
    ...row,
    ownershipPercentage:
      project.targetCapital > 0
        ? round2((Number(row.amount) / project.targetCapital) * 100)
        : 0,
  }));

  const ownerAlreadyInRows = withPct.some(
    (row: any) => String(row.investorId) === String(project.ownerId),
  );

  if (!ownerAlreadyInRows && project.ownerInvestment > 0) {
    const owner = await UserRepo.findById(String(project.ownerId));
    withPct.push({
      investorId: project.ownerId,
      amount: project.ownerInvestment,
      name: owner?.name ?? "Owner",
      email: owner?.email ?? "",
      role: owner?.role ?? "OWNER",
      ownershipPercentage:
        project.targetCapital > 0
          ? round2((project.ownerInvestment / project.targetCapital) * 100)
          : 0,
    });
  }

  withPct.sort((a: any, b: any) => Number(b.amount) - Number(a.amount));

  return {
    project: {
      id: project._id,
      title: project.title,
      targetCapital: project.targetCapital,
      currentCapital: project.currentCapital,
      status: project.status,
      maxInvestmentPercentage: project.maxInvestmentPercentage,
    },
    capTable: withPct,
  };
};

export default {
  createProject,
  listOpenProjects,
  getProjectById,
  listOwnerProjects,
  updateProject,
  deleteProject,
  closeProject,
  getCapTable,
};
