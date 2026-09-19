import { CreateCollabPostSchema } from "@campus/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { sessionMiddleware } from "../../middleware/session";

export const collabRoutes = new Hono()
	.use("*", sessionMiddleware)
	.get("/", async (c) => {
		return c.json({ projects: [] });
	})
	.post("/", zValidator("json", CreateCollabPostSchema), async (c) => {
		const data = c.req.valid("json");
		return c.json(
			{ success: true, collab: { id: crypto.randomUUID(), ...data } },
			201,
		);
	});
