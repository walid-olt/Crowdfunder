import mongoose from "mongoose";
import type {Iinvestment,Iproject,Iuser} from "../interfaces/index.js"

const UserSchema = new mongoose.Schema<Iuser>({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {type: String, enum: ["ADMIN","INVESTOR","OWNER"], required: true},
    balance: {type: Number, default: 0}
},{timestamps:true});

const ProjectSchema = new mongoose.Schema<Iproject>({
    title: {type: String, required: true},
    description: {type: String, required: true},
    currentCapital: {type: Number, default: 0},
    targetCapital: {type: Number, required: true},
    ownerId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    status: {type: String, enum: ["OPEN","CLOSED"], default: "OPEN"},
    maxInvestmentPercentage: {type: Number, required: true, default: 50, min: 1, max: 100},
    ownerInvestment: {type: Number, default: 0},
},{timestamps:true});

const InvestmentSchema = new mongoose.Schema<Iinvestment>({
    projectId: {type: mongoose.Schema.Types.ObjectId, ref:"Project", required:true},
    investorId:{type: mongoose.Schema.Types.ObjectId, ref:"User", required:true},
    amount:{type:Number, required:true},
    percentageOwned: {type: Number, default: 0},
},{timestamps:true})



const User = mongoose.model<Iuser>("User", UserSchema);
const Project = mongoose.model<Iproject>("Project", ProjectSchema);
const Investment = mongoose.model<Iinvestment>("Investment", InvestmentSchema);

export {User, Project, Investment};