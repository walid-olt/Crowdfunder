import type { Handler } from "express";
import { catchAsync } from "../middleware/global.js";
import { sendResponse } from "../utils/response.js";
import investmentService from "../services/investment.service.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

const getMyPortfolio: Handler = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) throw new UnauthorizedError("Unauthorized");

  if (user.role === "INVESTOR") {
    const data = await investmentService.getInvestorPortfolio(user.id);
    return sendResponse(res, 200, data);
  }

  if (user.role === "OWNER") {
    const data = await investmentService.getOwnerPortfolio(user.id);
    return sendResponse(res, 200, data);
  }

  throw new ForbiddenError("Admins must query a specific portfolio by id");
});

const getInvestorPortfolio: Handler = catchAsync(async (req, res) => {
  const investorId = req.params.investorId as string;
  const data = await investmentService.getInvestorPortfolio(investorId);
  return sendResponse(res, 200, data);
});

const getOwnerPortfolio: Handler = catchAsync(async (req, res) => {
  const ownerId = req.params.ownerId as string;
  const data = await investmentService.getOwnerPortfolio(ownerId);
  return sendResponse(res, 200, data);
});

export default {
  getMyPortfolio,
  getInvestorPortfolio,
  getOwnerPortfolio,
};
