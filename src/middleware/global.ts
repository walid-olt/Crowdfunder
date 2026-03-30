import { AppError, ValidationError } from "../utils/errors.js";
import type { Request, Response, NextFunction, RequestHandler } from "express";

export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err.message);
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      // wierd syntax but it only adds the errors property if the error is a ValidationError
      ...(err instanceof ValidationError && { errors: err.errors }),
      code: err.code,
      stack: err.stack
    });
  }
  return res.status(500).json({
    status: "error",
    message: "Internal Server Error",
    stack: err.stack
  });
};



type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;
export const catchAsync = (fn: AsyncRequestHandler): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
