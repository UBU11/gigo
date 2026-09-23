import {
	type CreateFeedPost,
	CreateFeedPostSchema,
	type CreateFeedResponse,
	type FeedListResponse,
	type FeedPostDto,
} from "@campus/contracts";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api-client";

export function useFeed() {
	const [posts, setPosts] = useState<FeedPostDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchFeed = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await apiRequest<FeedListResponse>("/api/feed");
			setPosts(res.posts);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load feed");
		} finally {
			setLoading(false);
		}
	}, []);

	const createPost = useCallback(
		async (payload: CreateFeedPost): Promise<FeedPostDto> => {
			const validation = CreateFeedPostSchema.safeParse(payload);
			if (!validation.success) {
				const errorMessage =
					validation.error.issues[0]?.message || "Invalid post data";
				setError(errorMessage);
				throw new Error(errorMessage);
			}

			setCreating(true);
			setError(null);
			try {
				const res = await apiRequest<CreateFeedResponse>("/api/feed", {
					method: "POST",
					body: JSON.stringify(validation.data),
				});
				setPosts((prev) => [res.post, ...prev]);
				return res.post;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to create post";
				setError(errorMessage);
				throw err;
			} finally {
				setCreating(false);
			}
		},
		[],
	);

	useEffect(() => {
		void fetchFeed();
	}, [fetchFeed]);

	return {
		posts,
		loading,
		creating,
		error,
		createPost,
		refetch: fetchFeed,
	};
}
