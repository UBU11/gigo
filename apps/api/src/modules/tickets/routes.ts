import { CheckInTicketSchema, ClaimTicketSchema } from "@campus/contracts";
import { Hono } from "hono";
import { requireRole } from "../../middleware/rbac";
import { sessionMiddleware } from "../../middleware/session";
import { validatedJson } from "../../middleware/validator";
import { executeCheckIn } from "./check-in";
import { claimTicketAtomic, getUserTickets } from "./service";

export const ticketRoutes = new Hono()
	.use("*", sessionMiddleware)
	.get("/", async (c) => {
		const user = c.get("user");
		const tickets = await getUserTickets(user.id);
		return c.json({ success: true, tickets }, 200);
	})
	.post("/claim", validatedJson(ClaimTicketSchema), async (c) => {
		const user = c.get("user");
		const { eventId } = c.req.valid("json");

		const result = await claimTicketAtomic(eventId, user.id);
		if (!result.success) {
			return c.json({ success: false, error: result.error }, result.status);
		}

		return c.json({ success: true, ticket: result.ticket }, 201);
	})
	.post(
		"/check-in",
		requireRole(["organizer", "admin"]),
		validatedJson(CheckInTicketSchema),
		async (c) => {
			const { ticketToken, eventId } = c.req.valid("json");
			const result = await executeCheckIn(ticketToken, eventId);

			if (!result.success) {
				const status =
					result.error === "ALREADY_CHECKED_IN_OR_INVALID" ? 409 : 400;
				return c.json({ success: false, error: result.error }, status);
			}

			return c.json({ success: true, ticket: result.ticket }, 200);
		},
	);
