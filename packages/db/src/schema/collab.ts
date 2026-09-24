import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { publicProfiles } from "./profiles";

export const collabPosts = pgTable("collab_posts", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.references(() => publicProfiles.userId, { onDelete: "cascade" }),
	title: text("title").notNull(),
	description: text("description").notNull(),
	requiredSkills: text("required_skills")
		.array()
		.notNull()
		.default(sql`'{}'::text[]`),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});
