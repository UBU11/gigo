import { z } from "zod";

export const CreateFeedPostSchema = z.object({
	content: z.string().min(1).max(2000),
	tag: z.string().min(1).max(30).optional(),
});
export type CreateFeedPost = z.infer<typeof CreateFeedPostSchema>;

export const FeedPostDtoSchema = z.object({
	id: z.string().uuid(),
	content: z.string(),
	tag: z.string().nullable().optional(),
	authorPseudoHandle: z.string(),
	authorAvatarSeed: z.string(),
	upvotes: z.number().int(),
	createdAt: z.date(),
});
export type FeedPostDto = z.infer<typeof FeedPostDtoSchema>;

export const FeedListResponseSchema = z.object({
	success: z.literal(true),
	posts: z.array(FeedPostDtoSchema),
});
export type FeedListResponse = z.infer<typeof FeedListResponseSchema>;

export const CreateFeedResponseSchema = z.object({
	success: z.literal(true),
	post: FeedPostDtoSchema,
});
export type CreateFeedResponse = z.infer<typeof CreateFeedResponseSchema>;
