import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { verifyTicket } from "@campus/crypto";
import { db, events, tickets } from "@campus/db";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getTicketKeys } from "../src/lib/keys";
import { executeCheckIn } from "../src/modules/tickets/check-in";
import { ticketRoutes } from "../src/modules/tickets/routes";
import {
	claimTicketAtomic,
	generateTicketToken,
	getUserTickets,
} from "../src/modules/tickets/service";
import { cleanupTestData, createTestEvent, createTestUser } from "./fixtures";

describe("Ticket Cryptographic Issuance Service", () => {
	it("generates an Ed25519-signed ticket token verifiable via public key", async () => {
		const keys = await getTicketKeys();
		const ticketId = "123e4567-e89b-12d3-a456-426614174000";
		const eventId = "223e4567-e89b-12d3-a456-426614174001";
		const userId = "usr_student123";

		const token = await generateTicketToken(eventId, userId, ticketId);

		expect(token).toBeDefined();
		expect(typeof token).toBe("string");
		expect(token).toContain(".");

		const verification = await verifyTicket(token, keys.publicKeySpki);
		expect(verification.valid).toBe(true);
		expect(verification.payload?.tid).toBe(ticketId);
		expect(verification.payload?.eid).toBe(eventId);
		expect(verification.payload?.uid).toBe(userId);
	});

	it("fails verification if the generated ticket is altered", async () => {
		const keys = await getTicketKeys();
		const ticketId = "123e4567-e89b-12d3-a456-426614174000";
		const eventId = "223e4567-e89b-12d3-a456-426614174001";
		const userId = "usr_student123";

		const token = await generateTicketToken(eventId, userId, ticketId);
		const tamperedToken = `${token}tampered`;

		const verification = await verifyTicket(tamperedToken, keys.publicKeySpki);
		expect(verification.valid).toBe(false);
	});
});

describe("Atomic Ticket Claiming & Concurrency Guard", () => {
	beforeEach(async () => {
		await cleanupTestData();
	});

	afterAll(async () => {
		await cleanupTestData();
	});

	it("prevents duplicate ticket claims for the same user and event", async () => {
		const testUser = await createTestUser();
		const testEvent = await createTestEvent(5);

		const firstResult = await claimTicketAtomic(testEvent.id, testUser.id);
		expect(firstResult.success).toBe(true);

		const secondResult = await claimTicketAtomic(testEvent.id, testUser.id);
		expect(secondResult.success).toBe(false);
		if (!secondResult.success) {
			expect(secondResult.error).toBe("ALREADY_CLAIMED");
			expect(secondResult.status).toBe(409);
		}

		const [eventRecord] = await db
			.select()
			.from(events)
			.where(eq(events.id, testEvent.id));
		expect(eventRecord?.capacity).toBe(4);
	});

	it("prevents claiming when event has zero capacity", async () => {
		const testUser = await createTestUser();
		const testEvent = await createTestEvent(0);

		const result = await claimTicketAtomic(testEvent.id, testUser.id);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("EVENT_SOLD_OUT");
			expect(result.status).toBe(409);
		}
	});

	it("prevents overselling under concurrent claim requests", async () => {
		const capacity = 2;
		const testEvent = await createTestEvent(capacity);
		const users = await Promise.all([
			createTestUser(),
			createTestUser(),
			createTestUser(),
			createTestUser(),
			createTestUser(),
		]);

		const results = await Promise.all(
			users.map((user) => claimTicketAtomic(testEvent.id, user.id)),
		);

		const successful = results.filter((r) => r.success);
		const soldOut = results.filter(
			(r) => !r.success && r.error === "EVENT_SOLD_OUT",
		);

		expect(successful.length).toBe(2);
		expect(soldOut.length).toBe(3);

		const [eventRecord] = await db
			.select()
			.from(events)
			.where(eq(events.id, testEvent.id));
		expect(eventRecord?.capacity).toBe(0);

		const issuedTickets = await db
			.select()
			.from(tickets)
			.where(eq(tickets.eventId, testEvent.id));
		expect(issuedTickets.length).toBe(2);
	});

	it("prevents concurrent duplicate claims by the same user", async () => {
		const testUser = await createTestUser();
		const testEvent = await createTestEvent(5);

		const results = await Promise.all([
			claimTicketAtomic(testEvent.id, testUser.id),
			claimTicketAtomic(testEvent.id, testUser.id),
			claimTicketAtomic(testEvent.id, testUser.id),
		]);

		const successful = results.filter((r) => r.success);
		const duplicate = results.filter(
			(r) => !r.success && r.error === "ALREADY_CLAIMED",
		);

		expect(successful.length).toBe(1);
		expect(duplicate.length).toBe(2);

		const [eventRecord] = await db
			.select()
			.from(events)
			.where(eq(events.id, testEvent.id));
		expect(eventRecord?.capacity).toBe(4);

		const issuedTickets = await db
			.select()
			.from(tickets)
			.where(eq(tickets.eventId, testEvent.id));
		expect(issuedTickets.length).toBe(1);
	});
});

describe("Cryptographic Ticket Check-In Engine", () => {
	beforeEach(async () => {
		await cleanupTestData();
	});

	it("checks in a valid Ed25519-signed ticket successfully", async () => {
		const testUser = await createTestUser();
		const testEvent = await createTestEvent(10);
		const claimResult = await claimTicketAtomic(testEvent.id, testUser.id);
		expect(claimResult.success).toBe(true);
		if (!claimResult.success) return;

		const checkInResult = await executeCheckIn(
			claimResult.ticket.signedToken,
			testEvent.id,
		);
		expect(checkInResult.success).toBe(true);
		if (checkInResult.success) {
			expect(checkInResult.ticket.id).toBe(claimResult.ticket.id);
		}

		const [ticketRecord] = await db
			.select()
			.from(tickets)
			.where(eq(tickets.id, claimResult.ticket.id));
		expect(ticketRecord?.status).toBe("CHECKED_IN");
		expect(ticketRecord?.checkedInAt).toBeDefined();
	});

	it("rejects check-in with invalid or tampered signature", async () => {
		const testUser = await createTestUser();
		const testEvent = await createTestEvent(10);
		const claimResult = await claimTicketAtomic(testEvent.id, testUser.id);
		expect(claimResult.success).toBe(true);
		if (!claimResult.success) return;

		const tamperedToken = `${claimResult.ticket.signedToken}tampered`;
		const checkInResult = await executeCheckIn(tamperedToken, testEvent.id);
		expect(checkInResult.success).toBe(false);
		if (!checkInResult.success) {
			expect(checkInResult.error).toBe("INVALID_OR_EXPIRED_SIGNATURE");
		}
	});

	it("rejects check-in when eventId does not match token payload", async () => {
		const testUser = await createTestUser();
		const testEvent = await createTestEvent(10);
		const otherEvent = await createTestEvent(10);
		const claimResult = await claimTicketAtomic(testEvent.id, testUser.id);
		expect(claimResult.success).toBe(true);
		if (!claimResult.success) return;

		const checkInResult = await executeCheckIn(
			claimResult.ticket.signedToken,
			otherEvent.id,
		);
		expect(checkInResult.success).toBe(false);
		if (!checkInResult.success) {
			expect(checkInResult.error).toBe("EVENT_MISMATCH");
		}
	});

	it("prevents duplicate check-in of an already checked-in ticket", async () => {
		const testUser = await createTestUser();
		const testEvent = await createTestEvent(10);
		const claimResult = await claimTicketAtomic(testEvent.id, testUser.id);
		expect(claimResult.success).toBe(true);
		if (!claimResult.success) return;

		const firstCheckIn = await executeCheckIn(
			claimResult.ticket.signedToken,
			testEvent.id,
		);
		expect(firstCheckIn.success).toBe(true);

		const secondCheckIn = await executeCheckIn(
			claimResult.ticket.signedToken,
			testEvent.id,
		);
		expect(secondCheckIn.success).toBe(false);
		if (!secondCheckIn.success) {
			expect(secondCheckIn.error).toBe("ALREADY_CHECKED_IN_OR_INVALID");
		}
	});
});

describe("User Tickets Service", () => {
	beforeEach(async () => {
		await cleanupTestData();
	});

	afterAll(async () => {
		await cleanupTestData();
	});

	it("retrieves all claimed tickets for a user", async () => {
		const user = await createTestUser();
		const event1 = await createTestEvent(10);
		const event2 = await createTestEvent(10);

		await claimTicketAtomic(event1.id, user.id);
		await claimTicketAtomic(event2.id, user.id);

		const userTickets = await getUserTickets(user.id);
		expect(userTickets.length).toBe(2);
		expect(userTickets[0]?.userId).toBe(user.id);
		expect(userTickets[1]?.userId).toBe(user.id);
	});
});

describe("Ticket HTTP Routes & RBAC Integration", () => {
	beforeEach(async () => {
		await cleanupTestData();
	});

	afterAll(async () => {
		await cleanupTestData();
	});

	it("GET / rejects unauthenticated requests with 401", async () => {
		const app = new Hono().route("/api/tickets", ticketRoutes);
		const res = await app.request("/api/tickets");
		expect(res.status).toBe(401);
		const body = await res.json();
		expect(body).toEqual({ success: false, error: "UNAUTHORIZED" });
	});

	it("GET / returns user's claimed tickets when authenticated", async () => {
		const user = await createTestUser();
		const event = await createTestEvent(10);
		await claimTicketAtomic(event.id, user.id);

		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				role: "user",
			});
			await next();
		});
		app.route("/api/tickets", ticketRoutes);

		const res = await app.request("/api/tickets");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toMatchObject({
			success: true,
			tickets: [{ userId: user.id }],
		});
	});

	it("POST /claim rejects unauthenticated requests with 401", async () => {
		const app = new Hono().route("/api/tickets", ticketRoutes);
		const res = await app.request("/api/tickets/claim", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ eventId: "223e4567-e89b-12d3-a456-426614174001" }),
		});
		expect(res.status).toBe(401);
		const body = await res.json();
		expect(body).toEqual({ success: false, error: "UNAUTHORIZED" });
	});

	it("POST /claim claims a ticket successfully when authenticated", async () => {
		const user = await createTestUser();
		const event = await createTestEvent(10);

		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				role: "user",
			});
			await next();
		});
		app.route("/api/tickets", ticketRoutes);

		const res = await app.request("/api/tickets/claim", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ eventId: event.id }),
		});
		expect(res.status).toBe(201);
		const body = await res.json();
		expect(body).toMatchObject({
			success: true,
			ticket: { eventId: event.id, userId: user.id },
		});
	});

	it("POST /claim returns 409 ALREADY_CLAIMED on duplicate claim", async () => {
		const user = await createTestUser();
		const event = await createTestEvent(10);
		await claimTicketAtomic(event.id, user.id);

		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				role: "user",
			});
			await next();
		});
		app.route("/api/tickets", ticketRoutes);

		const res = await app.request("/api/tickets/claim", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ eventId: event.id }),
		});
		expect(res.status).toBe(409);
		const body = await res.json();
		expect(body).toEqual({ success: false, error: "ALREADY_CLAIMED" });
	});

	it("POST /claim returns 400 VALIDATION_FAILED when payload is invalid", async () => {
		const user = await createTestUser();

		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				role: "user",
			});
			await next();
		});
		app.route("/api/tickets", ticketRoutes);

		const res = await app.request("/api/tickets/claim", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ eventId: "not-a-valid-uuid" }),
		});
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body).toMatchObject({
			success: false,
			error: "VALIDATION_FAILED",
		});
	});

	it("POST /check-in rejects unauthenticated requests with 401", async () => {
		const app = new Hono().route("/api/tickets", ticketRoutes);
		const res = await app.request("/api/tickets/check-in", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ticketToken: "valid-token-longer-than-10" }),
		});
		expect(res.status).toBe(401);
		const body = await res.json();
		expect(body).toEqual({ success: false, error: "UNAUTHORIZED" });
	});

	it("POST /check-in rejects regular student with 403 FORBIDDEN", async () => {
		const student = await createTestUser();
		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: student.id,
				name: student.name,
				email: student.email,
				emailVerified: student.emailVerified,
				role: "user",
			});
			await next();
		});
		app.route("/api/tickets", ticketRoutes);

		const res = await app.request("/api/tickets/check-in", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ticketToken: "valid-token-longer-than-10" }),
		});
		expect(res.status).toBe(403);
		const body = await res.json();
		expect(body).toEqual({ success: false, error: "FORBIDDEN" });
	});

	it("POST /check-in returns 400 VALIDATION_FAILED when payload is invalid", async () => {
		const organizer = await createTestUser();

		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: organizer.id,
				name: organizer.name,
				email: organizer.email,
				emailVerified: organizer.emailVerified,
				role: "organizer",
			});
			await next();
		});
		app.route("/api/tickets", ticketRoutes);

		const res = await app.request("/api/tickets/check-in", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ticketToken: "short" }),
		});
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body).toMatchObject({
			success: false,
			error: "VALIDATION_FAILED",
		});
	});

	it("POST /check-in allows organizer to check in a valid ticket", async () => {
		const student = await createTestUser();
		const organizer = await createTestUser();
		const event = await createTestEvent(10);
		const claim = await claimTicketAtomic(event.id, student.id);
		expect(claim.success).toBe(true);
		if (!claim.success) return;

		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: organizer.id,
				name: organizer.name,
				email: organizer.email,
				emailVerified: organizer.emailVerified,
				role: "organizer",
			});
			await next();
		});
		app.route("/api/tickets", ticketRoutes);

		const res = await app.request("/api/tickets/check-in", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				ticketToken: claim.ticket.signedToken,
				eventId: event.id,
			}),
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toMatchObject({
			success: true,
			ticket: { id: claim.ticket.id },
		});
	});

	it("POST /check-in returns 409 when ticket is already checked in", async () => {
		const student = await createTestUser();
		const organizer = await createTestUser();
		const event = await createTestEvent(10);
		const claim = await claimTicketAtomic(event.id, student.id);
		expect(claim.success).toBe(true);
		if (!claim.success) return;

		await executeCheckIn(claim.ticket.signedToken, event.id);

		const app = new Hono();
		app.use("*", async (c, next) => {
			c.set("user", {
				id: organizer.id,
				name: organizer.name,
				email: organizer.email,
				emailVerified: organizer.emailVerified,
				role: "organizer",
			});
			await next();
		});
		app.route("/api/tickets", ticketRoutes);

		const res = await app.request("/api/tickets/check-in", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				ticketToken: claim.ticket.signedToken,
				eventId: event.id,
			}),
		});
		expect(res.status).toBe(409);
		const body = await res.json();
		expect(body).toEqual({
			success: false,
			error: "ALREADY_CHECKED_IN_OR_INVALID",
		});
	});
});
