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
	eventId: z.string().uuid().optional(),
});
export type CheckInTicket = z.infer<typeof CheckInTicketSchema>;

export const TicketStatusSchema = z.enum(["ISSUED", "CHECKED_IN", "CANCELLED"]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const UserTicketDtoSchema = z.object({
	id: z.string().uuid(),
	eventId: z.string().uuid(),
	userId: z.string(),
	status: TicketStatusSchema,
	signedToken: z.string(),
	checkedInAt: z.coerce.date().nullable().optional(),
	createdAt: z.coerce.date(),
});
export type UserTicketDto = z.infer<typeof UserTicketDtoSchema>;

export const UserTicketsResponseSchema = z.object({
	success: z.literal(true),
	tickets: z.array(UserTicketDtoSchema),
});
export type UserTicketsResponse = z.infer<typeof UserTicketsResponseSchema>;

export const ClaimTicketResponseSchema = z.object({
	success: z.literal(true),
	ticket: UserTicketDtoSchema,
});
export type ClaimTicketResponse = z.infer<typeof ClaimTicketResponseSchema>;

export const CheckInTicketResultSchema = z.object({
	id: z.string().uuid(),
	checkedInAt: z.coerce.date().nullable().optional(),
});
export type CheckInTicketResult = z.infer<typeof CheckInTicketResultSchema>;

export const CheckInTicketResponseSchema = z.object({
	success: z.literal(true),
	ticket: CheckInTicketResultSchema,
});
export type CheckInTicketResponse = z.infer<typeof CheckInTicketResponseSchema>;
