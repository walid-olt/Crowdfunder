import { verifyToken} from "../services/jwt.service.js";
import {Request, Response, NextFunction} from "express";
import {ForbiddenError, UnauthorizedError} from "../utils/errors.js";
import type { Iuser, ROLE } from "../interfaces/index.js";

type TokenPayload = {
  id: string;
  email: string;
  role: Iuser["role"];
};

const isTokenPayload = (value: unknown): value is TokenPayload => {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.id === "string" &&
    typeof payload.email === "string" &&
    (payload.role === "OWNER" ||
      payload.role === "INVESTOR" ||
      payload.role === "ADMIN")
  );
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.token;
  if(!token) return next(new UnauthorizedError("No token provided"));
  const decoded = verifyToken(token);
  if (!isTokenPayload(decoded)) {
    return next(new UnauthorizedError("Invalid token"));
  }
  Object.assign(req, {user: decoded});
  next();
};

export const authorize = (roles: ROLE[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(new UnauthorizedError("No authenticated user"));
    }
    if (!roles.includes(user.role))
      return next(new ForbiddenError("User not authorized"));
    next();
  };
};


export const requireToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1] ;
  if (!token) return next(new UnauthorizedError("No token provided"));
  Object.assign(req, {token});
  next();
};

export const requireSelf = (paramKey: string = "userId") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(new UnauthorizedError("No authenticated user"));
    }
    const rawParam = (req.params as any)?.[paramKey];
    if (!rawParam) {
      return next(new ForbiddenError(`Missing ${paramKey}`));
    }
    if (String(rawParam) !== user.id) {
      return next(new ForbiddenError("Not allowed"));
    }
    next();
  };
};

export const requireSelfOrRoles = (roles: ROLE[], paramKey: string = "userId") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(new UnauthorizedError("No authenticated user"));
    }
    if (roles.includes(user.role)) {
      return next();
    }
    const rawParam = (req.params as any)?.[paramKey];
    if (!rawParam) {
      return next(new ForbiddenError(`Missing ${paramKey}`));
    }
    if (String(rawParam) !== user.id) {
      return next(new ForbiddenError("Not allowed"));
    }
    next();
  };
};
