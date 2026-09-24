import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { collabRoutes } from "../src/modules/collab/routes";
import { cleanupTestData, createTestUser } from "./fixtures";

describe("Collab HTTP Routes & Persistence Integration", () => {
	beforeEach(async () => {
		await cleanupTestData();
	});

	afterAll(async () => {
		await cleanupTestData();
	});

	it("GET / rejects unauthenticated requests with 401", async () => {
		const app = new Hono().route("/api/collab", collabRoutes);
		const res = await app.request("/api/collab");
		expect(res.status).toBe(401);
		const body = await res.json();
		expect(body).toEqual({ success: false, error: "UNAUTHORIZED" });
	});

	it("GET / returns empty list of projects when none exist", async () => {
		const user = await createTestUser();
		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", user);
			await next();
		});
		app.route("/api/collab", collabRoutes);

		const res = await app.request("/api/collab");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ success: true, projects: [] });
	});

	it("POST / returns 400 VALIDATION_FAILED when title is too short", async () => {
		const user = await createTestUser();
		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", user);
			await next();
		});
		app.route("/api/collab", collabRoutes);

		const res = await app.request("/api/collab", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: "No",
				description: "Valid description longer than ten characters",
				requiredSkills: ["Rust"],
			}),
		});
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body).toMatchObject({
			success: false,
			error: "VALIDATION_FAILED",
		});
	});

	it("POST / persists a collab project and GET / retrieves it with owner profile details", async () => {
		const user = await createTestUser();
		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", user);
			await next();
		});
		app.route("/api/collab", collabRoutes);

		const createRes = await app.request("/api/collab", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: "Solar-Powered Quadcopter",
				description:
					"Building an autonomous aerial drone with solar harvesting panels.",
				requiredSkills: ["Embedded C", "PCB Design", "Aerodynamics"],
			}),
		});

		expect(createRes.status).toBe(201);
		const createBody = (await createRes.json()) as {
			success: boolean;
			collab: {
				id: string;
				title: string;
				description: string;
				requiredSkills: string[];
				ownerUserId: string;
				ownerFullName: string;
				ownerDepartment: string;
			};
		};

		expect(createBody.success).toBe(true);
		expect(createBody.collab.title).toBe("Solar-Powered Quadcopter");
		expect(createBody.collab.requiredSkills).toEqual([
			"Embedded C",
			"PCB Design",
			"Aerodynamics",
		]);
		expect(createBody.collab.ownerUserId).toBe(user.id);
		expect(createBody.collab.ownerFullName).toBe(user.name);

		// Verify retrieval via GET /
		const listRes = await app.request("/api/collab");
		expect(listRes.status).toBe(200);
		const listBody = (await listRes.json()) as {
			success: boolean;
			projects: Array<{
				id: string;
				title: string;
				description: string;
				requiredSkills: string[];
				ownerFullName: string;
			}>;
		};

		expect(listBody.projects.length).toBe(1);
		expect(listBody.projects[0]?.title).toBe("Solar-Powered Quadcopter");
		expect(listBody.projects[0]?.requiredSkills).toEqual([
			"Embedded C",
			"PCB Design",
			"Aerodynamics",
		]);
		expect(listBody.projects[0]?.ownerFullName).toBe(user.name);
	});
});
