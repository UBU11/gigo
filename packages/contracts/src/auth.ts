import { z } from "zod";

export const InstitutionalDomainSchema = z.string().refine(
	(email) => {
		const domain = process.env.CAMPUS_EMAIL_DOMAIN || "college.ac.in";
		return email.endsWith(`@${domain}`);
	},
	{ message: "Email must belong to approved campus domain" },
);

export const AuthSessionUserSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().email(),
	emailVerified: z.boolean(),
	image: z.string().nullable().optional(),
	role: z.string().optional(),
});

export type AuthSessionUser = z.infer<typeof AuthSessionUserSchema>;
