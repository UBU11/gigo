import { describe, expect, it } from "bun:test";
import { verifyTicket } from "@campus/crypto";
import { getTicketKeys } from "../src/lib/keys";
import { generateTicketToken } from "../src/modules/tickets/service";

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
