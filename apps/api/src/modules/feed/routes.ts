import { CreateFeedPostSchema } from "@campus/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { sessionMiddleware } from "../../middleware/session";

export const feedRoutes = new Hono()
	.use("*", sessionMiddleware)
	.get("/", async (c) => {
		// Zero-Trust: Feed only returns pseudonymous handles. Never joins users table.
		return c.json({ posts: [] });
	})
	.post("/", zValidator("json", CreateFeedPostSchema), async (c) => {
		const data = c.req.valid("json");
		return c.json(
			{ success: true, post: { id: crypto.randomUUID(), ...data } },
			201,
		);
	});
