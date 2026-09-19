import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { errorHandler } from "../src/middleware/error";

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
