import { ClaimTicketSchema } from "@campus/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { sessionMiddleware } from "../../middleware/session";
import { claimTicketAtomic } from "./service";

export const ticketRoutes = new Hono()
	.use("*", sessionMiddleware)
	.post("/claim", zValidator("json", ClaimTicketSchema), async (c) => {
		const user = c.get("user") as { id: string };
		const { eventId } = c.req.valid("json");

		const result = await claimTicketAtomic(eventId, user.id);
		if (!result.success) {
			return c.json({ error: result.error }, result.status);
		}

		return c.json({ success: true, ticket: result.ticket }, 201);
	});
