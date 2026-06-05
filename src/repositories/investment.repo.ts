import { Iinvestment } from "../interfaces/index.js";
import { Model, Types } from "mongoose";
import { Investment } from "../models/index.js";
import { BaseRepository } from "./base.repo.js";

class InvestmentRepository extends BaseRepository<Iinvestment> {
  constructor(model: Model<Iinvestment>) {
    super(model);
  }

  async getTotalByInvestorAndProject(
    investorId: string,
    projectId: string,
  ): Promise<number> {
    const [result] = await this.model
      .aggregate<{ totalAmount: number }>([
        {
          $match: {
            investorId: new Types.ObjectId(investorId),
            projectId: new Types.ObjectId(projectId),
          },
        },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ])
      .exec();
    return result?.totalAmount ?? 0;
  }

  async findByProjectId(projectId: string) {
    return await this.findAll({ projectId: new Types.ObjectId(projectId) });
  }

  async deleteByProjectId(projectId: string) {
    const result = await this.model
      .deleteMany({ projectId: new Types.ObjectId(projectId) })
      .exec();
    return {
      acknowledged: result.acknowledged,
      deletedCount: result.deletedCount,
    };
  }

  async findByInvestorId(investorId: string) {
    return await this.findAll({ investorId: new Types.ObjectId(investorId) });
  }

  async getTotalInvestmentByProjectId(projectId: string) {
    return this.model
      .aggregate([
        { $match: { projectId: new Types.ObjectId(projectId) } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ])
      .exec();
  }

  async getTotalInvestmentByInvestorId(investorId: string): Promise<number> {
    const [{ totalAmount }] = await this.model
      .aggregate([
        { $match: { investorId: new Types.ObjectId(investorId) } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ])
      .exec();
    return totalAmount || 0;
  }

  async getInvestmentSummaryByInvestorId(investorId: string) {
    return this.model
      .aggregate([
        { $match: { investorId: new Types.ObjectId(investorId) } },
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            as: "projectDetails",
          },
        },
        { $unwind: "$projectDetails" },
        {
          $project: {
            amount: 1,
            projectTitle: "$projectDetails.title",
            projectStatus: "$projectDetails.status",
          },
        },
      ])
      .exec();
  }

  async getCapTableByProjectId(projectId: string) {
    return this.model
      .aggregate([
        { $match: { projectId: new Types.ObjectId(projectId) } },
        {
          $group: {
            _id: "$investorId",
            totalAmount: { $sum: "$amount" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "investor",
          },
        },
        { $unwind: "$investor" },
        {
          $project: {
            _id: 0,
            investorId: "$_id",
            amount: "$totalAmount",
            name: "$investor.name",
            email: "$investor.email",
            role: "$investor.role",
          },
        },
        { $sort: { amount: -1 } },
      ])
      .exec();
  }

  async getInvestorPortfolioByInvestorId(investorId: string) {
    return this.model
      .aggregate([
        { $match: { investorId: new Types.ObjectId(investorId) } },
        {
          $group: {
            _id: "$projectId",
            totalAmount: { $sum: "$amount" },
          },
        },
        {
          $lookup: {
            from: "projects",
            localField: "_id",
            foreignField: "_id",
            as: "project",
          },
        },
        { $unwind: "$project" },
        {
          $project: {
            _id: 0,
            projectId: "$_id",
            amount: "$totalAmount",
            projectTitle: "$project.title",
            projectStatus: "$project.status",
            targetCapital: "$project.targetCapital",
            ownershipPercentage: {
              $cond: [
                { $gt: ["$project.targetCapital", 0] },
                {
                  $floor: [
                    {
                      $multiply: [
                        { $divide: ["$totalAmount", "$project.targetCapital"] },
                        100,
                      ],
                    },
                    2,
                  ],
                },
                0,
              ],
            },
          },
        },
        { $sort: { amount: -1 } },
      ])
      .exec();
  }
}

export const investmentRepository = new InvestmentRepository(Investment);
export default investmentRepository;
