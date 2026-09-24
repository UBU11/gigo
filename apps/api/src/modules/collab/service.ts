import type { CollabPostDto, CreateCollabPost } from "@campus/contracts";
import { collabPosts, db, publicProfiles } from "@campus/db";
import { desc, eq } from "drizzle-orm";

export async function getOrCreatePublicProfile(user: {
	id: string;
	name?: string;
}) {
	const existing = await db
		.select()
		.from(publicProfiles)
		.where(eq(publicProfiles.userId, user.id))
		.limit(1);

	if (existing[0]) {
		return existing[0];
	}

	// ponytail: generate fallback public profile if not yet created via /api/profiles
	const defaultName = user.name?.trim() || "Student";
	const defaultYear = new Date().getFullYear();

	await db
		.insert(publicProfiles)
		.values({
			userId: user.id,
			fullName: defaultName,
			department: "General",
			batchYear: defaultYear,
			avatarUrl: null,
		})
		.onConflictDoNothing({ target: publicProfiles.userId });

	const [resolved] = await db
		.select()
		.from(publicProfiles)
		.where(eq(publicProfiles.userId, user.id))
		.limit(1);

	if (!resolved) {
		throw new Error("FAILED_TO_RESOLVE_PUBLIC_PROFILE");
	}

	return resolved;
}

export async function getCollabPosts(): Promise<CollabPostDto[]> {
	return db
		.select({
			id: collabPosts.id,
			title: collabPosts.title,
			description: collabPosts.description,
			requiredSkills: collabPosts.requiredSkills,
			ownerUserId: collabPosts.userId,
			ownerFullName: publicProfiles.fullName,
			ownerDepartment: publicProfiles.department,
			createdAt: collabPosts.createdAt,
		})
		.from(collabPosts)
		.innerJoin(publicProfiles, eq(collabPosts.userId, publicProfiles.userId))
		.orderBy(desc(collabPosts.createdAt));
}

export async function createCollabPost(
	user: { id: string; name?: string },
	input: CreateCollabPost,
): Promise<CollabPostDto> {
	const profile = await getOrCreatePublicProfile(user);

	const [created] = await db
		.insert(collabPosts)
		.values({
			userId: profile.userId,
			title: input.title,
			description: input.description,
			requiredSkills: input.requiredSkills,
		})
		.returning();

	if (!created) {
		throw new Error("FAILED_TO_CREATE_COLLAB_POST");
	}

	return {
		id: created.id,
		title: created.title,
		description: created.description,
		requiredSkills: created.requiredSkills,
		ownerUserId: created.userId,
		ownerFullName: profile.fullName,
		ownerDepartment: profile.department,
		createdAt: created.createdAt,
	};
}
