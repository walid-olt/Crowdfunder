import type  { Document, ObjectId, Types } from "mongoose"
import type { Request } from "express"

export interface Iproject extends Document{
    title: string;
    description: string;
    currentCapital: number;
    targetCapital: number;
    ownerId: Types.ObjectId;
    status: "OPEN" | "CLOSED";
    maxInvestmentPercentage: number;
    ownerInvestment: number;
}


export interface Iuser extends Document{
    name: string;
    email: string;
    password: string;
    role: "OWNER" | "INVESTOR" | "ADMIN";
    balance?: number;
}


export interface Iinvestment extends Document{
    projectId: Types.ObjectId;
    investorId: Types.ObjectId;
    amount: number;
    percentageOwned?: number;
}

export interface IinvestmentSummary {
    projectId: Types.ObjectId;
    amount: number;
    projectTitle?: string;
    projectStatus?: "OPEN" | "CLOSED";
    ownershipPercentage?: number;
}

export interface IuserSummary {
  name: string;
  email: string;
  role: "OWNER" | "INVESTOR" | "ADMIN";
  balance?: number;
  totalInvested?: number;
  projectsOwned?: Partial<Iproject & { percentageFunded?: number }>[];
    investmentsMade?: IinvestmentSummary[];
}


export type ROLE = "OWNER" | "INVESTOR" | "ADMIN";
