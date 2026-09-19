import type { Context } from "hono";

export function errorHandler(err: Error, c: Context) {
	console.error(`[API ERROR] ${err.name}: ${err.message}`);
	const isProduction = process.env.NODE_ENV === "production";
	return c.json(
		{
			success: false,
			error: isProduction
				? "INTERNAL_SERVER_ERROR"
				: err.message || "INTERNAL_SERVER_ERROR",
		},
		500,
	);
}
