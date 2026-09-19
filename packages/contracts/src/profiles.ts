import { z } from "zod";

export const PublicProfileSchema = z.object({
	userId: z.string(),
	fullName: z.string().min(2).max(100),
	department: z.string().min(2).max(50),
	batchYear: z.number().int().min(2000).max(2100),
	avatarUrl: z.string().url().nullable().optional(),
	updatedAt: z.date(),
});
export type PublicProfile = z.infer<typeof PublicProfileSchema>;

export const UpdatePublicProfileSchema = PublicProfileSchema.omit({
	userId: true,
	updatedAt: true,
});
export type UpdatePublicProfile = z.infer<typeof UpdatePublicProfileSchema>;

export const PseudoProfileSchema = z.object({
	userId: z.string(),
	pseudoHandle: z
		.string()
		.min(3)
		.max(30)
		.regex(/^[A-Za-z0-9_]+$/),
	avatarSeed: z.string().min(1).max(64),
	reputationScore: z.number().int().default(0),
	createdAt: z.date(),
});
export type PseudoProfile = z.infer<typeof PseudoProfileSchema>;

export const CreatePseudoProfileSchema = PseudoProfileSchema.omit({
	userId: true,
	reputationScore: true,
	createdAt: true,
});
export type CreatePseudoProfile = z.infer<typeof CreatePseudoProfileSchema>;
