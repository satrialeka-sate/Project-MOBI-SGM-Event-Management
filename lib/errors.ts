import { errorResponse } from "./api-response";
import { ZodError } from "zod";

export class AppError extends Error {
  public statusCode: number;
  public errors: string[];

  constructor(message: string, statusCode: number = 400, errors: string[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = "AppError";
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const messages = error.issues.map(
      (e) => `${e.path.join(".")}: ${e.message}`
    );
    return errorResponse("Validation failed", messages, 422);
  }

  if (error instanceof AppError) {
    return errorResponse(error.message, error.errors, error.statusCode);
  }

  if (error instanceof Error) {
    console.error("Unhandled error:", error);
    return errorResponse("Internal server error", [], 500);
  }

  return errorResponse("Internal server error", [], 500);
}
