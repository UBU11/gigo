import {
	collabPosts,
	db,
	events,
	feedPosts,
	feedVotes,
	pseudoProfiles,
	publicProfiles,
	tickets,
	user,
} from "@campus/db";

export async function createTestUser(
	id: string = `usr_${crypto.randomUUID()}`,
) {
	const [created] = await db
		.insert(user)
		.values({
			id,
			name: `Student ${id}`,
			email: `${id}@college.ac.in`,
			emailVerified: true,
		})
		.returning();

	if (!created) {
		throw new Error("Failed to create test user");
	}

	return created;
}

export async function createTestEvent(capacity: number) {
	const [created] = await db
		.insert(events)
		.values({
			title: "Hackathon 2026",
			description: "Campus Hackathon",
			capacity,
			heldAt: new Date(Date.now() + 86400000),
		})
		.returning();

	if (!created) {
		throw new Error("Failed to create test event");
	}

	return created;
}

export async function cleanupTestData() {
	await db.delete(feedVotes);
	await db.delete(feedPosts);
	await db.delete(collabPosts);
	await db.delete(tickets);
	await db.delete(events);
	await db.delete(pseudoProfiles);
	await db.delete(publicProfiles);
	await db.delete(user);
}
