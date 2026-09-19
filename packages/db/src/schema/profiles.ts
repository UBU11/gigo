import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const publicProfiles = pgTable("public_profiles", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	fullName: text("full_name").notNull(),
	department: text("department").notNull(),
	batchYear: integer("batch_year").notNull(),
	avatarUrl: text("avatar_url"),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const pseudoProfiles = pgTable("pseudo_profiles", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	pseudoHandle: text("pseudo_handle").notNull().unique(),
	avatarSeed: text("avatar_seed").notNull(),
	reputationScore: integer("reputation_score").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});
