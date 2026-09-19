import { db } from "@campus/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "./env";

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg" }),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID || "mock-client-id",
			clientSecret: env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
			authorization: {
				params: {
					hd: env.CAMPUS_EMAIL_DOMAIN,
					prompt: "select_account",
				},
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					if (!user.email.endsWith(`@${env.CAMPUS_EMAIL_DOMAIN}`)) {
						throw new Error(
							`UNAUTHORIZED_DOMAIN: Registration restricted to @${env.CAMPUS_EMAIL_DOMAIN}`,
						);
					}
					return { data: user };
				},
			},
		},
	},
});
