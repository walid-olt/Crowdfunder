import { Types } from "mongoose";
import investmentRepository from "../repositories/investment.repo.js";
import { projectRepository } from "../repositories/project.repo.js";
import UserRepo from "../repositories/user.repo.js";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../utils/errors.js";

const round2 = (value: number) => Math.round(value * 100) / 100;

const investInProject = async (payload: {
  projectId: string;
  investorId: string;
  amount: number;
}) => {
  if (payload.amount <= 0 || !Number.isFinite(payload.amount)) {
    throw new BadRequestError("amount must be a positive number");
  }

  const project = await projectRepository.findByIdOrThrow(payload.projectId);

  if (project.status !== "OPEN") {
    throw new ConflictError("Investments are only allowed for OPEN projects");
  }

  const remaining = project.targetCapital - project.currentCapital;
  if (payload.amount > remaining) {
    throw new ConflictError("Investment exceeds remaining capital needed");
  }

  const investor = await UserRepo.findById(payload.investorId);
  if (!investor) throw new NotFoundError("Investor not found");
  if (investor.role !== "INVESTOR") {
    throw new ForbiddenError("Only INVESTOR users can invest");
  }

  const maxAllowedByProject = (project.targetCapital * project.maxInvestmentPercentage) / 100;
  const existingTotal = await investmentRepository.getTotalByInvestorAndProject(
    payload.investorId,
    payload.projectId,
  );

  if (existingTotal + payload.amount > maxAllowedByProject) {
    throw new ConflictError(
      `Investment exceeds max allowed total of ${project.maxInvestmentPercentage}% for this project`,
    );
  }

  // Deduct first (atomic check). If the project update fails, we'll refund.
  await UserRepo.deductFunds(payload.investorId, payload.amount);

  const updatedProject = await projectRepository.addCapitalIfOpen(
    payload.projectId,
    payload.amount,
  );

  if (!updatedProject) {
    await UserRepo.addFunds(payload.investorId, payload.amount);
    throw new ConflictError("Project cannot accept this investment");
  }

  const percentageOwned =
    project.targetCapital > 0
      ? round2((payload.amount / project.targetCapital) * 100)
      : 0;

  const investment = await investmentRepository.create({
    projectId: new Types.ObjectId(payload.projectId),
    investorId: new Types.ObjectId(payload.investorId),
    amount: payload.amount,
    percentageOwned,
  });

  return {
    investment,
    project: updatedProject,
  };
};

const getInvestorPortfolio = async (investorId: string) => {
  const investor = await UserRepo.findById(investorId);
  if (!investor) throw new NotFoundError("Investor not found");

  if (investor.role !== "INVESTOR") {
    throw new ConflictError("Requested user is not an INVESTOR");
  }

  const items = await investmentRepository.getInvestorPortfolioByInvestorId(investorId);
  const totalInvested = items.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  return {
    investor: {
      id: investor._id,
      name: investor.name,
      email: investor.email,
    },
    totalInvested,
    portfolio: items,
  };
};

const getOwnerPortfolio = async (ownerId: string) => {
  const owner = await UserRepo.findById(ownerId);
  if (!owner) throw new NotFoundError("Owner not found");

  if (owner.role !== "OWNER") {
    throw new ConflictError("Requested user is not an OWNER");
  }

  const projects = await projectRepository.findByOwnerId(ownerId);
  const portfolio = projects.map((project) => ({
    id: project._id,
    title: project.title,
    status: project.status,
    targetCapital: project.targetCapital,
    currentCapital: project.currentCapital,
    percentageFunded:
      project.targetCapital > 0
        ? round2((project.currentCapital / project.targetCapital) * 100)
        : 0,
  }));

  const totalRaised = projects.reduce(
    (sum, project) => sum + Number(project.currentCapital || 0),
    0,
  );

  return {
    owner: {
      id: owner._id,
      name: owner.name,
      email: owner.email,
    },
    totalRaised,
    projects: portfolio,
  };
};

export default {
  investInProject,
  getInvestorPortfolio,
  getOwnerPortfolio,
};
