import { BaseRepository } from "./base.repo.js";
import { User } from "../models/index.js";
import type { Iuser, IuserSummary, ROLE} from "../interfaces/index.js";
import type { Model } from "mongoose";
import { hashPassword } from "../utils/password.js";
import { ConflictError, NotFoundError , AppError} from "../utils/errors.js";
import {QueryFilter} from "mongoose"


export class UserRepository extends BaseRepository<Iuser>{
    constructor(model:Model<Iuser>){
        super(model)
    }
    async register(user: Partial<Iuser>): Promise<Iuser> {
        const hashedPassword = await hashPassword(user.password!);
        const userExist = await this.findOne({email:user.email!})
        if(userExist) {
            throw new ConflictError("User with this email already exists");
        }
        const newUser = await this.create({ ...user, password: hashedPassword });
        return newUser;
    }


   

    async findByEmail(email: string): Promise<Iuser | null> {
        return await this.findOne({ email });
    }

    async addFunds(userId: string, amount: number): Promise<Iuser | null> {
        const updated = await this.model
          .findOneAndUpdate(
            { _id: userId, role: "INVESTOR" },
            { $inc: { balance: amount } },
            { new: true },
          )
          .exec();

        if (!updated) {
          const user = await this.findById(userId);
          if (!user) throw new NotFoundError("User not found");
          throw new ConflictError(`User of role ${user.role} cannot have a balance`);
        }

        return updated;
    }

    async deductFunds(userId: string, amount: number): Promise<Iuser | null> {
        const updated = await this.model
          .findOneAndUpdate(
            { _id: userId, role: "INVESTOR", balance: { $gte: amount } },
            { $inc: { balance: -amount } },
            { new: true },
          )
          .exec();

        if (!updated) {
          const user = await this.findById(userId);
          if (!user) throw new NotFoundError("User not found");
          if (user.role !== "INVESTOR") {
            throw new ConflictError(`User of role ${user.role} cannot have a balance`);
          }
          throw new ConflictError("Insufficient funds");
        }

        return updated;
    }

    async updateBalance(userId: string, amount: number, operation: "add" | "deduct"): Promise<Iuser | null> {
        if (operation === "add") {
            return await this.addFunds(userId, amount);
        } else {
            return await this.deductFunds(userId, amount);
        }
    }

    async getUserSummary(userId: string): Promise<IuserSummary> {
            const user = await this.findById(userId);
            if (!user) throw new NotFoundError("User not found");
            const [summary] =  await this.model
              .aggregate<IuserSummary>()
              .match({ _id: user._id })
              .lookup({
                from: "projects", 
                localField: "_id",
                foreignField: "ownerId",
                as: "projectsOwned",
              })

              .lookup({
                from: "investments",
                localField: "_id",
                foreignField: "investorId",
                as: "investmentsMade",
              })

              .lookup({
                from: "projects",
                localField: "investmentsMade.projectId",
                foreignField: "_id",
                as: "investedProjects",
              })

              .addFields({
                totalInvested: { $sum: "$investmentsMade.amount" },
                projectsOwned: {
                  $map: {
                    input: "$projectsOwned",
                    as: "project",
                    in: {
                      $mergeObjects: [
                        "$$project",
                        {
                          percentageFunded: {
                            $cond: [
                              { $gt: ["$$project.targetCapital", 0] },
                              {
                                $round: [
                                  {
                                    $multiply: [
                                      {
                                        $divide: [
                                          "$$project.currentCapital",
                                          "$$project.targetCapital",
                                        ],
                                      },
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
                      ],
                    },
                  },
                },
                investmentsMade: {
                  $map: {
                    input: "$investmentsMade",
                    as: "investment",
                    in: {
                      $let: {
                        vars: {
                          project: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$investedProjects",
                                  as: "project",
                                  cond: {
                                    $eq: ["$$project._id", "$$investment.projectId"],
                                  },
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: {
                          projectId: "$$investment.projectId",
                          amount: "$$investment.amount",
                          projectTitle: "$$project.title",
                          projectStatus: "$$project.status",
                          ownershipPercentage: {
                            $cond: [
                              { $gt: ["$$project.targetCapital", 0] },
                              {
                                $round: [
                                  {
                                    $multiply: [
                                      {
                                        $divide: [
                                          "$$investment.amount",
                                          "$$project.targetCapital",
                                        ],
                                      },
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
                    },
                  },
                },
              })

              .project({
                _id: 0, 
                name: 1, 
                email: 1,
                role: 1,
                balance: 1,
                projectsOwned: 1,
                investmentsMade: 1,
                totalInvested: 1,
              }).exec()

            if(!summary) throw new AppError(500, "INTERNAL_ERROR", "couldn't get user details")
            return summary
    }       

    async listByRole(role: ROLE, filter?: QueryFilter<Iuser> ): Promise<Iuser[]> {
        return await this.findAll({ ...filter, role });
    }
    

}
const UserRepo = new UserRepository(User)
export default UserRepo