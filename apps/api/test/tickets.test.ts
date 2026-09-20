import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { verifyTicket } from "@campus/crypto";
import { db, events, pool, tickets } from "@campus/db";
import { eq } from "drizzle-orm";
import { getTicketKeys } from "../src/lib/keys";
import {
	claimTicketAtomic,
	generateTicketToken,
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
		await pool.end();
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
