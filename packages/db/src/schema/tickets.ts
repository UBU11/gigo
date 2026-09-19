import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { events } from "./events";

export const ticketStatusEnum = pgEnum("ticket_status", [
	"ISSUED",
	"CHECKED_IN",
	"CANCELLED",
]);

export const tickets = pgTable("tickets", {
	id: uuid("id").primaryKey().defaultRandom(),
	eventId: uuid("event_id")
		.notNull()
		.references(() => events.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	status: ticketStatusEnum("status").notNull().default("ISSUED"),
	signedToken: text("signed_token").notNull(),
	checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});
