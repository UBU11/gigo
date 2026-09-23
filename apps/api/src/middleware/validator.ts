import type { ApiErrorResponse } from "@campus/contracts";
import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";

export function validatedJson<T extends ZodSchema>(schema: T) {
	return zValidator("json", schema, (result, c) => {
		if (!result.success) {
			const errorResponse: ApiErrorResponse = {
				success: false,
				error: "VALIDATION_FAILED",
				details: result.error.flatten(),
			};
			return c.json(errorResponse, 400);
		}
	});
}
