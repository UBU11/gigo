import { z } from "zod";

export const CreateCollabPostSchema = z.object({
	title: z.string().min(3).max(120),
	description: z.string().min(10).max(4000),
	requiredSkills: z.array(z.string().min(1).max(30)).max(10),
});
export type CreateCollabPost = z.infer<typeof CreateCollabPostSchema>;

export const CollabPostDtoSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	description: z.string(),
	requiredSkills: z.array(z.string()),
	ownerUserId: z.string(),
	ownerFullName: z.string(),
	ownerDepartment: z.string(),
	createdAt: z.date(),
});
export type CollabPostDto = z.infer<typeof CollabPostDtoSchema>;

export const CollabListResponseSchema = z.object({
	success: z.literal(true),
	projects: z.array(CollabPostDtoSchema),
});
export type CollabListResponse = z.infer<typeof CollabListResponseSchema>;

export const CreateCollabResponseSchema = z.object({
	success: z.literal(true),
	collab: CollabPostDtoSchema,
});
export type CreateCollabResponse = z.infer<typeof CreateCollabResponseSchema>;
