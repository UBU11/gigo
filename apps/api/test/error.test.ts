import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "../src/middleware/error";
import { validatedJson } from "../src/middleware/validator";

function restoreNodeEnv(originalEnv: string | undefined) {
	if (originalEnv !== undefined) {
		process.env.NODE_ENV = originalEnv;
	} else {
		delete process.env.NODE_ENV;
	}
}

describe("Error Handler Middleware", () => {
	it("returns raw error message when not in production", async () => {
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";
		try {
			const app = new Hono();
			app.onError(errorHandler);
			app.get("/error", () => {
				throw new Error("Sensitive database column user_credentials leaked");
			});

			const res = await app.request("/error");
			expect(res.status).toBe(500);
			const body = await res.json();
			expect(body).toEqual({
				success: false,
				error: "Sensitive database column user_credentials leaked",
			});
		} finally {
			restoreNodeEnv(originalEnv);
		}
	});

	it("sanitizes error message to INTERNAL_SERVER_ERROR in production", async () => {
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "production";
		try {
			const app = new Hono();
			app.onError(errorHandler);
			app.get("/error", () => {
				throw new Error("Sensitive database column user_credentials leaked");
			});

			const res = await app.request("/error");
			expect(res.status).toBe(500);
			const body = await res.json();
			expect(body).toEqual({
				success: false,
				error: "INTERNAL_SERVER_ERROR",
			});
		} finally {
			restoreNodeEnv(originalEnv);
		}
	});
});

describe("Validation Middleware (validatedJson)", () => {
	const testSchema = z.object({
		title: z.string().min(3),
		count: z.number().int().positive(),
	});

	it("returns 400 with VALIDATION_FAILED and error details when payload is invalid", async () => {
		const app = new Hono();
		app.post("/test", validatedJson(testSchema), (c) =>
			c.json({ success: true }),
		);

		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "ab", count: -1 }),
		});

		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.error).toBe("VALIDATION_FAILED");
		expect(body.details).toBeDefined();
		expect(body.details.fieldErrors).toBeDefined();
	});

	it("passes valid payload through to handler", async () => {
		const app = new Hono();
		app.post("/test", validatedJson(testSchema), (c) =>
			c.json({ success: true }),
		);

		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Valid Title", count: 5 }),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ success: true });
	});
});
