import { CreateFeedPostSchema } from "@campus/contracts";
import { Hono } from "hono";
import { sessionMiddleware } from "../../middleware/session";
import { validatedJson } from "../../middleware/validator";
import { createFeedPost, getFeedPosts, toggleFeedPostVote } from "./service";

export const feedRoutes = new Hono()
	.use("*", sessionMiddleware)
	.get("/", async (c) => {
		const posts = await getFeedPosts();
		return c.json({ success: true, posts }, 200);
	})
	.post("/", validatedJson(CreateFeedPostSchema), async (c) => {
		const user = c.get("user");
		const data = c.req.valid("json");
		const post = await createFeedPost(user.id, data);
		return c.json({ success: true, post }, 201);
	})
	.post("/:id/vote", async (c) => {
		const user = c.get("user");
		const postId = c.req.param("id");
		const result = await toggleFeedPostVote(postId, user.id);
		return c.json({ success: true, ...result }, 200);
	});
