import { signTicket } from "@campus/crypto";
import { db, events, tickets } from "@campus/db";
import { and, eq, gt, sql } from "drizzle-orm";
import { getTicketKeys } from "../../lib/keys";

function isUniqueViolation(error: unknown): error is { code: string } {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		typeof Reflect.get(error, "code") === "string" &&
		Reflect.get(error, "code") === "23505"
	);
}

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

	try {
		return await db.transaction(async (tx) => {
			const event = await tx
				.update(events)
				.set({ capacity: sql`${events.capacity} - 1` })
				.where(and(eq(events.id, eventId), gt(events.capacity, 0)))
				.returning({ id: events.id });

			if (!event.length) {
				return {
					success: false as const,
					error: "EVENT_SOLD_OUT" as const,
					status: 409 as const,
				};
			}

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
					error: "FAILED_TO_CLAIM" as const,
					status: 400 as const,
				};
			}

			return { success: true as const, ticket: newTicket[0] };
		});
	} catch (error: unknown) {
		if (isUniqueViolation(error)) {
			return {
				success: false as const,
				error: "ALREADY_CLAIMED" as const,
				status: 409 as const,
			};
		}
		throw error;
	}
}

export async function getUserTickets(userId: string) {
	return db
		.select({
			id: tickets.id,
			eventId: tickets.eventId,
			userId: tickets.userId,
			status: tickets.status,
			signedToken: tickets.signedToken,
			checkedInAt: tickets.checkedInAt,
			createdAt: tickets.createdAt,
		})
		.from(tickets)
		.where(eq(tickets.userId, userId))
		.orderBy(tickets.createdAt);
}
