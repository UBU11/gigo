import {
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { pseudoProfiles } from "./profiles";

export const feedPosts = pgTable("feed_posts", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.references(() => pseudoProfiles.userId, { onDelete: "cascade" }),
	content: text("content").notNull(),
	tag: text("tag"),
	upvotes: integer("upvotes").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const feedVotes = pgTable(
	"feed_votes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		postId: uuid("post_id")
			.notNull()
			.references(() => feedPosts.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => pseudoProfiles.userId, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("feed_votes_post_user_idx").on(table.postId, table.userId),
	],
);
