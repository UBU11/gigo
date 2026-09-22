import type { ApiErrorResponse } from "@campus/contracts";
import type { Context } from "hono";

export function errorHandler(err: Error, c: Context) {
	console.error(`[API ERROR] ${err.name}: ${err.message}`);
	const isProduction = process.env.NODE_ENV === "production";
	const response: ApiErrorResponse = {
		success: false,
		error: isProduction
			? "INTERNAL_SERVER_ERROR"
			: err.message || "INTERNAL_SERVER_ERROR",
	};
	return c.json(response, 500);
}
