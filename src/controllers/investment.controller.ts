import type { Handler } from "express";
import { catchAsync } from "../middleware/global.js";
import { sendResponse } from "../utils/response.js";
import investmentService from "../services/investment.service.js";
import type { InvestInProjectInput } from "../schemas/investment.schemas.js";

const investInProject: Handler = catchAsync(async (req, res) => {
  const investorId = req.user?.id as string;
  const projectId = req.params.projectId as string;
  const payload = req.body as InvestInProjectInput;

  const result = await investmentService.investInProject({
    projectId,
    investorId,
    amount: payload.amount,
  });

  return sendResponse(res, 201, result, "Investment processed successfully");
});

export default {
  investInProject,
};
