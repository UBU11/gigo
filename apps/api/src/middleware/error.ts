import type { Context } from "hono";

export function errorHandler(err: Error, c: Context) {
	console.error(`[API ERROR] ${err.name}: ${err.message}`);
	return c.json(
		{
			success: false,
			error: err.message || "INTERNAL_SERVER_ERROR",
		},
		500,
	);
}
