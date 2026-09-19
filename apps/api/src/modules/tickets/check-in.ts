import { db, tickets } from "@campus/db";
import { and, eq } from "drizzle-orm";

export async function executeCheckIn(ticketId: string, eventId: string) {
	const updated = await db
		.update(tickets)
		.set({
			status: "CHECKED_IN",
			checkedInAt: new Date(),
		})
		.where(
			and(
				eq(tickets.id, ticketId),
				eq(tickets.eventId, eventId),
				eq(tickets.status, "ISSUED"),
			),
		)
		.returning({ id: tickets.id, checkedInAt: tickets.checkedInAt });

	if (updated.length === 0) {
		return { success: false, reason: "ALREADY_CHECKED_IN_OR_INVALID" };
	}

	return { success: true, ticket: updated[0] };
}
