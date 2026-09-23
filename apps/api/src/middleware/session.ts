import type { ApiErrorResponse, AuthSessionUser } from "@campus/contracts";
import type { Context, Next } from "hono";
import { auth } from "../lib/auth";

declare module "hono" {
	interface ContextVariableMap {
		user: AuthSessionUser;
		session: unknown;
	}
}

export async function sessionMiddleware(c: Context, next: Next) {
	if (c.get("user")) {
		await next();
		return;
	}

	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		const errorResponse: ApiErrorResponse = {
			success: false,
			error: "UNAUTHORIZED",
		};
		return c.json(errorResponse, 401);
	}

	c.set("user", session.user);
	c.set("session", session.session);
	await next();
}
