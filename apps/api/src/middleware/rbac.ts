import type { ApiErrorResponse } from "@campus/contracts";
import type { Context, Next } from "hono";

export type Role = "admin" | "organizer" | "user";

function isRole(role: string): role is Role {
	return role === "admin" || role === "organizer" || role === "user";
}

export function requireRole(allowedRoles: Role[]) {
	return async (c: Context, next: Next) => {
		const user = c.get("user");
		if (!user) {
			const errorResponse: ApiErrorResponse = {
				success: false,
				error: "UNAUTHORIZED",
			};
			return c.json(errorResponse, 401);
		}

		const userRole = user.role ?? "user";
		if (!isRole(userRole) || !allowedRoles.includes(userRole)) {
			const errorResponse: ApiErrorResponse = {
				success: false,
				error: "FORBIDDEN",
			};
			return c.json(errorResponse, 403);
		}

		await next();
	};
}
