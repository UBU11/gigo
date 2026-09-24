import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { feedRoutes } from "../src/modules/feed/routes";
import { cleanupTestData, createTestUser } from "./fixtures";

describe("Feed HTTP Routes & Persistence Integration", () => {
	beforeEach(async () => {
		await cleanupTestData();
	});

	afterAll(async () => {
		await cleanupTestData();
	});

	it("GET / rejects unauthenticated requests with 401", async () => {
		const app = new Hono().route("/api/feed", feedRoutes);
		const res = await app.request("/api/feed");
		expect(res.status).toBe(401);
		const body = await res.json();
		expect(body).toEqual({ success: false, error: "UNAUTHORIZED" });
	});

	it("GET / returns empty list of posts when none exist", async () => {
		const user = await createTestUser();
		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", user);
			await next();
		});
		app.route("/api/feed", feedRoutes);

		const res = await app.request("/api/feed");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ success: true, posts: [] });
	});

	it("POST / returns 400 VALIDATION_FAILED when content is empty", async () => {
		const user = await createTestUser();
		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", user);
			await next();
		});
		app.route("/api/feed", feedRoutes);

		const res = await app.request("/api/feed", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: "" }),
		});
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body).toMatchObject({
			success: false,
			error: "VALIDATION_FAILED",
		});
	});

	it("POST / persists a feed post and GET / returns it with pseudonymous author", async () => {
		const user = await createTestUser();
		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", user);
			await next();
		});
		app.route("/api/feed", feedRoutes);

		const createRes = await app.request("/api/feed", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				content: "The library air conditioning is finally fixed!",
				tag: "library",
			}),
		});

		expect(createRes.status).toBe(201);
		const createBody = (await createRes.json()) as {
			success: boolean;
			post: {
				id: string;
				content: string;
				tag: string | null;
				authorPseudoHandle: string;
				authorAvatarSeed: string;
				upvotes: number;
			};
		};

		expect(createBody.success).toBe(true);
		expect(createBody.post.content).toBe(
			"The library air conditioning is finally fixed!",
		);
		expect(createBody.post.tag).toBe("library");
		expect(createBody.post.upvotes).toBe(0);
		expect(createBody.post.authorPseudoHandle).toMatch(/^Batch\d{2}_/);

		// Verify retrieval via GET /
		const listRes = await app.request("/api/feed");
		expect(listRes.status).toBe(200);
		const listBody = (await listRes.json()) as {
			success: boolean;
			posts: Array<Record<string, unknown>>;
		};

		expect(listBody.posts.length).toBe(1);
		expect(listBody.posts[0]?.content).toBe(
			"The library air conditioning is finally fixed!",
		);
		expect(listBody.posts[0]?.authorPseudoHandle).toBe(
			createBody.post.authorPseudoHandle,
		);

		// Zero-Trust Security Directive Verification:
		// Ensure neither email, real user name, nor internal userId is exposed
		const postKeys = Object.keys(listBody.posts[0] ?? {});
		expect(postKeys).not.toContain("email");
		expect(postKeys).not.toContain("name");
		expect(postKeys).not.toContain("userId");
		expect(postKeys).not.toContain("user_id");
		expect(JSON.stringify(listBody)).not.toContain(user.email);
		expect(JSON.stringify(listBody)).not.toContain(user.name);
	});

	it("POST /:id/vote toggles upvote status atomically", async () => {
		const user = await createTestUser();
		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", user);
			await next();
		});
		app.route("/api/feed", feedRoutes);

		const createRes = await app.request("/api/feed", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: "Vote test post" }),
		});
		const { post } = (await createRes.json()) as { post: { id: string } };

		// First vote -> upvotes increases to 1, hasVoted = true
		const voteRes1 = await app.request(`/api/feed/${post.id}/vote`, {
			method: "POST",
		});
		expect(voteRes1.status).toBe(200);
		const voteBody1 = await voteRes1.json();
		expect(voteBody1).toEqual({ success: true, upvotes: 1, hasVoted: true });

		// Second vote by same user -> toggles off, upvotes drops to 0, hasVoted = false
		const voteRes2 = await app.request(`/api/feed/${post.id}/vote`, {
			method: "POST",
		});
		expect(voteRes2.status).toBe(200);
		const voteBody2 = await voteRes2.json();
		expect(voteBody2).toEqual({ success: true, upvotes: 0, hasVoted: false });
	});
});
