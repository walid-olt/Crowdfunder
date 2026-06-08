import { Iproject } from "../interfaces/index.js";
import { Model } from "mongoose";
import { Project } from "../models/index.js";
import { BaseRepository } from "./base.repo.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";

export class ProjectRepository extends BaseRepository<Iproject> {
  constructor(model: Model<Iproject>) {
    super(model);
  }

  async findOpenProjects() {
    return this.findAll({ status: "OPEN" });
  }
  async findAllProjects() {
    return this.findAll();
  }

  async findByOwnerId(ownerId: string) {
    return this.findAll({ ownerId });
  }

  async findByIdOrThrow(id: string) {
    const project = await this.findById(id);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return project;
  }

  async updateProjectStatus(id: string, status: "OPEN" | "CLOSED") {
    const project = await this.findByIdOrThrow(id);
    if (project.status === status) {
      throw new ConflictError(`Project is already ${status}`);
    }
    project.status = status;
    return await project.save();
  }

  async addCapitalIfOpen(projectId: string, amount: number) {
    // Atomic update to prevent overflow + auto-close when funded.
    // Returns null if project is CLOSED, missing, or would exceed target.
    return this.model
      .findOneAndUpdate(
        {
          _id: projectId,
          status: "OPEN",
          $expr: {
            $lte: [{ $add: ["$currentCapital", amount] }, "$targetCapital"],
          },
        },
        [
          {
            $set: {
              currentCapital: { $add: ["$currentCapital", amount] },
              status: {
                $cond: [
                  {
                    $gte: [
                      { $add: ["$currentCapital", amount] },
                      "$targetCapital",
                    ],
                  },
                  "CLOSED",
                  "OPEN",
                ],
              },
            },
          },
        ],
        { new: true, updatePipeline: true },
      )
      .exec();
  }

  async updateByOwnerIfOpen(
    projectId: string,
    ownerId: string,
    update: Partial<Iproject>,
  ) {
    return this.model
      .findOneAndUpdate(
        { _id: projectId, ownerId, status: "OPEN" },
        { $set: update },
        { new: true },
      )
      .exec();
  }

  async deleteByOwnerIfOpen(projectId: string, ownerId: string) {
    return this.model
      .findOneAndDelete({ _id: projectId, ownerId, status: "OPEN" })
      .exec();
  }
}

export const projectRepository = new ProjectRepository(Project);
