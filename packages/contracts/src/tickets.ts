import { z } from "zod";

export const TicketTokenPayloadSchema = z.object({
	tid: z.string().uuid(),
	eid: z.string().uuid(),
	uid: z.string(),
	iat: z.number().int(),
	exp: z.number().int(),
});
export type TicketTokenPayload = z.infer<typeof TicketTokenPayloadSchema>;

export const ClaimTicketSchema = z.object({
	eventId: z.string().uuid(),
});
export type ClaimTicket = z.infer<typeof ClaimTicketSchema>;

export const CheckInTicketSchema = z.object({
	ticketToken: z.string().min(10),
});
export type CheckInTicket = z.infer<typeof CheckInTicketSchema>;

export const TicketStatusSchema = z.enum(["ISSUED", "CHECKED_IN", "CANCELLED"]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;
