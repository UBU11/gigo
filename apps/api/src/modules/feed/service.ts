import type { CreateFeedPost, FeedPostDto } from "@campus/contracts";
import { db, feedPosts, feedVotes, pseudoProfiles } from "@campus/db";
import { and, desc, eq, sql } from "drizzle-orm";

export async function getOrCreatePseudoProfile(userId: string) {
	const existing = await db
		.select()
		.from(pseudoProfiles)
		.where(eq(pseudoProfiles.userId, userId))
		.limit(1);

	if (existing[0]) {
		return existing[0];
	}

	// ponytail: generate deterministic pseudonymous identity if not yet created via /api/profiles
	const shortId = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-6) || "anon";
	const currentYearSuffix = new Date().getFullYear().toString().slice(-2);
	const defaultHandle = `Batch${currentYearSuffix}_${shortId}`;
	const defaultSeed = userId.slice(0, 12);

	await db
		.insert(pseudoProfiles)
		.values({
			userId,
			pseudoHandle: defaultHandle,
			avatarSeed: defaultSeed,
			reputationScore: 0,
		})
		.onConflictDoNothing({ target: pseudoProfiles.userId });

	const [resolved] = await db
		.select()
		.from(pseudoProfiles)
		.where(eq(pseudoProfiles.userId, userId))
		.limit(1);

	if (!resolved) {
		throw new Error("FAILED_TO_RESOLVE_PSEUDO_PROFILE");
	}

	return resolved;
}

export async function getFeedPosts(): Promise<FeedPostDto[]> {
	// Zero-Trust Security Directive: NEVER join user or public_profiles with pseudo_profiles
	return db
		.select({
			id: feedPosts.id,
			content: feedPosts.content,
			tag: feedPosts.tag,
			upvotes: feedPosts.upvotes,
			createdAt: feedPosts.createdAt,
			authorPseudoHandle: pseudoProfiles.pseudoHandle,
			authorAvatarSeed: pseudoProfiles.avatarSeed,
		})
		.from(feedPosts)
		.innerJoin(pseudoProfiles, eq(feedPosts.userId, pseudoProfiles.userId))
		.orderBy(desc(feedPosts.createdAt));
}

export async function createFeedPost(
	userId: string,
	input: CreateFeedPost,
): Promise<FeedPostDto> {
	const profile = await getOrCreatePseudoProfile(userId);

	const [created] = await db
		.insert(feedPosts)
		.values({
			userId: profile.userId,
			content: input.content,
			tag: input.tag ?? null,
			upvotes: 0,
		})
		.returning();

	if (!created) {
		throw new Error("FAILED_TO_CREATE_FEED_POST");
	}

	return {
		id: created.id,
		content: created.content,
		tag: created.tag,
		upvotes: created.upvotes,
		createdAt: created.createdAt,
		authorPseudoHandle: profile.pseudoHandle,
		authorAvatarSeed: profile.avatarSeed,
	};
}

export async function toggleFeedPostVote(
	postId: string,
	userId: string,
): Promise<{ upvotes: number; hasVoted: boolean }> {
	await getOrCreatePseudoProfile(userId);

	return db.transaction(async (tx) => {
		const existingVote = await tx
			.select()
			.from(feedVotes)
			.where(and(eq(feedVotes.postId, postId), eq(feedVotes.userId, userId)))
			.limit(1);

		if (existingVote.length > 0) {
			await tx
				.delete(feedVotes)
				.where(and(eq(feedVotes.postId, postId), eq(feedVotes.userId, userId)));
			const [updatedPost] = await tx
				.update(feedPosts)
				.set({ upvotes: sql`GREATEST(${feedPosts.upvotes} - 1, 0)` })
				.where(eq(feedPosts.id, postId))
				.returning({ upvotes: feedPosts.upvotes });

			return {
				upvotes: updatedPost ? updatedPost.upvotes : 0,
				hasVoted: false,
			};
		}

		await tx.insert(feedVotes).values({ postId, userId });
		const [updatedPost] = await tx
			.update(feedPosts)
			.set({ upvotes: sql`${feedPosts.upvotes} + 1` })
			.where(eq(feedPosts.id, postId))
			.returning({ upvotes: feedPosts.upvotes });

		return {
			upvotes: updatedPost ? updatedPost.upvotes : 1,
			hasVoted: true,
		};
	});
}
