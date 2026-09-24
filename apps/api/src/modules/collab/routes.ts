import { CreateCollabPostSchema } from "@campus/contracts";
import { Hono } from "hono";
import { sessionMiddleware } from "../../middleware/session";
import { validatedJson } from "../../middleware/validator";
import { createCollabPost, getCollabPosts } from "./service";

export const collabRoutes = new Hono()
	.use("*", sessionMiddleware)
	.get("/", async (c) => {
		const projects = await getCollabPosts();
		return c.json({ success: true, projects }, 200);
	})
	.post("/", validatedJson(CreateCollabPostSchema), async (c) => {
		const user = c.get("user");
		const data = c.req.valid("json");
		const collab = await createCollabPost(user, data);
		return c.json({ success: true, collab }, 201);
	});
