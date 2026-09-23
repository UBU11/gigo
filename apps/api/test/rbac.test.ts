import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { requireRole } from "../src/middleware/rbac";

describe("RBAC Middleware", () => {
	it("returns 401 if user is not in context", async () => {
		const app = new Hono();
		app.use("*", requireRole(["organizer", "admin"]));
		app.get("/test", (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(401);
		const body = await res.json();
		expect(body).toEqual({ success: false, error: "UNAUTHORIZED" });
	});

	it("returns 403 if user lacks required role", async () => {
		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: "usr_student",
				role: "user",
				name: "Student",
				email: "student@college.ac.in",
				emailVerified: true,
			});
			await next();
		});
		app.use("*", requireRole(["organizer", "admin"]));
		app.get("/test", (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(403);
		const body = await res.json();
		expect(body).toEqual({ success: false, error: "FORBIDDEN" });
	});

	it("allows user with organizer role", async () => {
		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: "usr_org",
				role: "organizer",
				name: "Organizer",
				email: "organizer@college.ac.in",
				emailVerified: true,
			});
			await next();
		});
		app.use("*", requireRole(["organizer", "admin"]));
		app.get("/test", (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ ok: true });
	});

	it("allows user with admin role", async () => {
		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: "usr_admin",
				role: "admin",
				name: "Admin",
				email: "admin@college.ac.in",
				emailVerified: true,
			});
			await next();
		});
		app.use("*", requireRole(["organizer", "admin"]));
		app.get("/test", (c) => c.json({ ok: true }));

		const res = await app.request("/test");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ ok: true });
	});
});
