import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export async function parseJson(request, schema) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }

  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "Request body failed validation.", error.flatten());
    }

    throw error;
  }
}

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleRouteError(error) {
  if (error instanceof HttpError) {
    return json(
      {
        error: {
          message: error.message,
          details: error.details
        }
      },
      error.status
    );
  }

  console.error("Unhandled API route error", error);

  return json(
    {
      error: {
        message: "An unexpected server error occurred."
      }
    },
    500
  );
}
