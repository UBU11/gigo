import { CheckInTicketSchema, ClaimTicketSchema } from "@campus/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireRole } from "../../middleware/rbac";
import { sessionMiddleware } from "../../middleware/session";
import { executeCheckIn } from "./check-in";
import { claimTicketAtomic, getUserTickets } from "./service";

export const ticketRoutes = new Hono()
	.use("*", sessionMiddleware)
	.get("/", async (c) => {
		const user = c.get("user") as { id: string };
		const tickets = await getUserTickets(user.id);
		return c.json({ success: true, tickets }, 200);
	})
	.post("/claim", zValidator("json", ClaimTicketSchema), async (c) => {
		const user = c.get("user") as { id: string };
		const { eventId } = c.req.valid("json");

		const result = await claimTicketAtomic(eventId, user.id);
		if (!result.success) {
			return c.json({ error: result.error }, result.status);
		}

		return c.json({ success: true, ticket: result.ticket }, 201);
	})
	.post(
		"/check-in",
		requireRole(["organizer", "admin"]),
		zValidator("json", CheckInTicketSchema),
		async (c) => {
			const { ticketToken, eventId } = c.req.valid("json");
			const result = await executeCheckIn(ticketToken, eventId);

			if (!result.success) {
				const status =
					result.reason === "ALREADY_CHECKED_IN_OR_INVALID" ? 409 : 400;
				return c.json({ error: result.reason }, status);
			}

			return c.json({ success: true, ticket: result.ticket }, 200);
		},
	);
