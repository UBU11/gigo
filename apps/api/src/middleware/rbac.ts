import type { Context, Next } from "hono";

export type Role = "admin" | "organizer" | "user";

// ponytail: minimal role check on authenticated session user
export function requireRole(allowedRoles: Role[]) {
	return async (c: Context, next: Next) => {
		const user = c.get("user") as { id: string; role?: Role } | undefined;
		if (!user) {
			return c.json({ error: "UNAUTHORIZED" }, 401);
		}

		const userRole = user.role ?? "user";
		if (!allowedRoles.includes(userRole)) {
			return c.json({ error: "FORBIDDEN" }, 403);
		}

		await next();
	};
}
