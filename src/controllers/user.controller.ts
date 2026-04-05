import { Handler } from "express";
import { catchAsync } from "../middleware/global.js";
import UserRepo from "../repositories/user.repo.js";
import { sendResponse } from "../utils/response.js";
import { NotFoundError } from "../utils/errors.js";
import {  UserBalanceUpdateInput} from "../schemas/user.schemas.js";

const toSafeUser = (user: any) => {
  const safe = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
  return typeof user.balance === "number" ? { ...safe, balance: user.balance } : safe;
};


const getProfile: Handler = catchAsync(async (req, res) => {
  const id = req.params?.userId as string;
  if(!id ) throw new NotFoundError()
  const data =  await UserRepo.getUserSummary(id);
  sendResponse(res , 200 , data )
})


const getAllUsers:Handler = catchAsync(async (req , res )=>{
  const role = (req.query?.role as string | undefined)?.toUpperCase();
  const data =
    role === "OWNER" || role === "INVESTOR" || role === "ADMIN"
    ? await UserRepo.listByRole(role)
    : await UserRepo.findAll();

  sendResponse(res, 200 , data.map(toSafeUser) )
})


const updateUserBalance : Handler = catchAsync(async (req,res)=>{
    const {amount , operation} = req.body as UserBalanceUpdateInput
    const userId = req.user?.id as string
    if(!userId) throw new NotFoundError("User not found")
    const updatedUser = await UserRepo.updateBalance(userId, amount, operation)
    if (!updatedUser) throw new NotFoundError("User not found");
    sendResponse(res, 200 , toSafeUser(updatedUser))

})





export default {getProfile,getAllUsers,updateUserBalance}