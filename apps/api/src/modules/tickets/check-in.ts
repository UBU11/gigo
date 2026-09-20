import { verifyTicket } from "@campus/crypto";
import { db, tickets } from "@campus/db";
import { and, eq } from "drizzle-orm";
import { getTicketKeys } from "../../lib/keys";

export async function executeCheckIn(ticketToken: string, eventId?: string) {
	// ponytail: minimal cryptographic check-in verifying Ed25519 signature and atomic db flip
	const keys = await getTicketKeys();
	const verification = await verifyTicket(ticketToken, keys.publicKeySpki);

	if (!verification.valid || !verification.payload) {
		return {
			success: false as const,
			reason: "INVALID_OR_EXPIRED_SIGNATURE" as const,
		};
	}

	if (eventId && verification.payload.eid !== eventId) {
		return { success: false as const, reason: "EVENT_MISMATCH" as const };
	}

	const ticketId = verification.payload.tid;
	const targetEventId = verification.payload.eid;

	const updated = await db
		.update(tickets)
		.set({
			status: "CHECKED_IN",
			checkedInAt: new Date(),
		})
		.where(
			and(
				eq(tickets.id, ticketId),
				eq(tickets.eventId, targetEventId),
				eq(tickets.status, "ISSUED"),
			),
		)
		.returning({ id: tickets.id, checkedInAt: tickets.checkedInAt });

	const ticket = updated[0];
	if (!ticket) {
		return {
			success: false as const,
			reason: "ALREADY_CHECKED_IN_OR_INVALID" as const,
		};
	}

	return { success: true as const, ticket };
}
