import type { ZodIssue } from "zod";
const ERROR_CODES = {
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
} as const

interface IAppError {
  statusCode: number;
  status: "error";
  code: typeof ERROR_CODES[keyof typeof ERROR_CODES];
  message: string;
  errors?: any[];
}

class AppError extends Error implements IAppError {
  public statusCode: number;
  public status: "error";
  public code: typeof ERROR_CODES[keyof typeof ERROR_CODES];
  public message: string;
  public errors?: any[];

  constructor(
    statusCode: number,
    code: typeof ERROR_CODES[keyof typeof ERROR_CODES],
    message: string,
    errors?: any[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = "error";
    this.code = code;
    this.message = message;
    if (errors !== undefined) {
      this.errors = errors;
    }
  }
}

class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(404, ERROR_CODES.NOT_FOUND, message);
  }
}

class BadRequestError extends AppError {
  constructor(message: string = "Bad request", errors?: any[]) {
    super(400, ERROR_CODES.BAD_REQUEST, message, errors);
  }
}

class ValidationError extends AppError {
  declare public errors?: string[];
  constructor(message: string = "Validation error", zodIssues?: ZodIssue[]) {
    super(422, ERROR_CODES.VALIDATION_ERROR, message, zodIssues);
    if (zodIssues !== undefined) {
      this.errors = zodIssues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
    }
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(401, ERROR_CODES.UNAUTHORIZED, message);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(403, ERROR_CODES.FORBIDDEN, message);
  }
}

class ConflictError extends AppError {
  constructor(message: string = "Conflict") {
    super(409, ERROR_CODES.CONFLICT, message);
  }
}

export {
  AppError,
  NotFoundError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
};
