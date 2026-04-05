import type { Handler } from "express";
import UserRepo from "../repositories/user.repo.js";
import { generateToken } from "../services/jwt.service.js";
import { sendResponse } from "../utils/response.js";
import { comparePassword } from "../utils/password.js";
import { UnauthorizedError } from "../utils/errors.js";
import type { LoginInput, RegisterUserInput } from "../schemas/user.schemas.js";
import type { Iuser } from "../interfaces/index.js";
import { catchAsync } from "../middleware/global.js";

const toSafeUser = (user: Iuser) => {
  const safeUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return typeof user.balance === "number"
    ? { ...safeUser, balance: user.balance }
    : safeUser;
};

export const register: Handler = catchAsync(async (req, res) => {
    const payload = req.body as RegisterUserInput;
    const registerPayload =
        typeof payload.balance === "number"
            ? payload
            : (({ balance, ...rest }) => rest)(payload);
    const user = await UserRepo.register(registerPayload);
    const token = generateToken({
        id: String(user._id),
        email: user.email,
        role: user.role,
    });

    return sendResponse(
        res,
        201,
        {
            token,
            user: toSafeUser(user),
        },
        "User registered successfully",
    );
})

export const login: Handler = catchAsync(async (req, res) => {
    const payload = req.body as LoginInput;
    const user = await UserRepo.findByEmail(payload.email);

    if (!user) {
        throw new UnauthorizedError("Invalid credentials");
    }

    const isPasswordValid = await comparePassword(payload.password, user.password);
    if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid credentials");
    }

    const token = generateToken({
        id: String(user._id),
        email: user.email,
        role: user.role,
    });

    return sendResponse(
        res,
        200,
        {
            token,
            user: toSafeUser(user),
        },
        "User logged in successfully",
    );
})


export const getCurrentUser: Handler = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    if(!userId) {
        throw new UnauthorizedError("Unauthorized");
    }
    const user = await UserRepo.findById(userId);
    if(!user) {
        throw new UnauthorizedError("User not found");
    }
    return sendResponse(
        res,
        200,
        {
            user: toSafeUser(user),
        },
        "Current user retrieved successfully",
    );
});

export default {
    register,
    login,
    getCurrentUser,
};
