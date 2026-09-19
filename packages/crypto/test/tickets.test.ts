import { describe, expect, it } from "bun:test";
import { generateTicketKeyPair, signTicket, verifyTicket } from "../src";

describe("Ed25519 Ticket Cryptography", () => {
	it("generates key pair, signs, and successfully verifies ticket pass", async () => {
		const keys = await generateTicketKeyPair();
		const payload = {
			tid: "a0000000-0000-0000-0000-000000000001",
			eid: "b0000000-0000-0000-0000-000000000002",
			uid: "user-456",
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 3600,
		};

		const token = await signTicket(payload, keys.privateKeyPkcs8);
		expect(token).toContain(".");

		const result = await verifyTicket(token, keys.publicKeySpki);
		expect(result.valid).toBe(true);
		expect(result.payload?.tid).toBe(payload.tid);
	});

	it("fails verification if token signature is tampered", async () => {
		const keys = await generateTicketKeyPair();
		const payload = {
			tid: "a0000000-0000-0000-0000-000000000001",
			eid: "b0000000-0000-0000-0000-000000000002",
			uid: "user-456",
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 3600,
		};

		const token = await signTicket(payload, keys.privateKeyPkcs8);
		const tampered = token.slice(0, -4) + "AAAA";

		const result = await verifyTicket(tampered, keys.publicKeySpki);
		expect(result.valid).toBe(false);
	});

	it("rejects expired ticket", async () => {
		const keys = await generateTicketKeyPair();
		const payload = {
			tid: "a0000000-0000-0000-0000-000000000001",
			eid: "b0000000-0000-0000-0000-000000000002",
			uid: "user-456",
			iat: Math.floor(Date.now() / 1000) - 7200,
			exp: Math.floor(Date.now() / 1000) - 3600,
		};

		const token = await signTicket(payload, keys.privateKeyPkcs8);
		const result = await verifyTicket(token, keys.publicKeySpki);
		expect(result.valid).toBe(false);
	});
});
