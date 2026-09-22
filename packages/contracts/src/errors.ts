import { z } from "zod";

export const ApiErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.string(),
	details: z.unknown().optional(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
