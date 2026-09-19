import { z } from "zod";

const EnvSchema = z.object({
	PORT: z.coerce.number().default(3000),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	CAMPUS_EMAIL_DOMAIN: z.string().default("college.ac.in"),
	DATABASE_URL: z
		.string()
		.default("postgresql://campus:campus_secret@localhost:5432/campus_db"),
	REDIS_URL: z.string().default("redis://localhost:6379"),
	BETTER_AUTH_SECRET: z
		.string()
		.min(16)
		.default("changethis_supersecret_default_key"),
	BETTER_AUTH_URL: z.string().default("http://localhost:3000"),
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
