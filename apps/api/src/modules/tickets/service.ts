import { signTicket } from "@campus/crypto";
import { db, tickets } from "@campus/db";
import { getTicketKeys } from "../../lib/keys";

export async function generateTicketToken(
	eventId: string,
	userId: string,
	ticketId: string = crypto.randomUUID(),
): Promise<string> {
	const keys = await getTicketKeys();
	const now = Math.floor(Date.now() / 1000);

	return signTicket(
		{
			tid: ticketId,
			eid: eventId,
			uid: userId,
			iat: now,
			exp: now + 7 * 86400,
		},
		keys.privateKeyPkcs8,
	);
}

export async function claimTicketAtomic(eventId: string, userId: string) {
	const ticketId = crypto.randomUUID();
	const signedToken = await generateTicketToken(eventId, userId, ticketId);

	return db.transaction(async (tx) => {
		const newTicket = await tx
			.insert(tickets)
			.values({
				id: ticketId,
				eventId,
				userId,
				status: "ISSUED",
				signedToken,
			})
			.returning();

		if (!newTicket[0]) {
			return {
				success: false as const,
				error: "FAILED_TO_CLAIM",
				status: 400 as const,
			};
		}

		return { success: true as const, ticket: newTicket[0] };
	});
}
