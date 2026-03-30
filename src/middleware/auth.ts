import { verifyToken} from "../services/jwt.service.js";
import {Request, Response, NextFunction} from "express";
import {UnauthorizedError} from "../utils/errors.js";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.token;
  if(!token) throw new UnauthorizedError("No token provided");
  const decoded = verifyToken(token);
  if (!decoded) return next(new UnauthorizedError("Invalid token"));
  Object.assign(req, {user:decoded});
  next();
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!roles.includes(user.role))
      return next(new UnauthorizedError("User not authorized"));
    next();
  };
};


export const requireToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1] ;
  if (!token) return next(new UnauthorizedError("No token provided"));
  Object.assign(req, {token});
  next();
};
