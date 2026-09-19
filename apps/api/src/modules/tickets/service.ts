import { db, tickets } from "@campus/db";

export async function claimTicketAtomic(eventId: string, userId: string) {
	return db.transaction(async (tx) => {
		const newTicket = await tx
			.insert(tickets)
			.values({
				eventId,
				userId,
				status: "ISSUED",
				signedToken: `token-${crypto.randomUUID()}`,
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
