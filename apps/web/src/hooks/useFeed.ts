import type { CreateFeedPost, FeedPostDto } from "@campus/contracts";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api-client";

interface FeedResponse {
	posts: FeedPostDto[];
}

interface CreateFeedResponse {
	success: boolean;
	post: FeedPostDto;
}

export function useFeed() {
	const [posts, setPosts] = useState<FeedPostDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchFeed = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await apiRequest<FeedResponse>("/api/feed");
			setPosts(res.posts);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load feed");
		} finally {
			setLoading(false);
		}
	}, []);

	const createPost = useCallback(
		async (payload: CreateFeedPost): Promise<FeedPostDto> => {
			const res = await apiRequest<CreateFeedResponse>("/api/feed", {
				method: "POST",
				body: JSON.stringify(payload),
			});
			setPosts((prev) => [res.post, ...prev]);
			return res.post;
		},
		[],
	);

	useEffect(() => {
		void fetchFeed();
	}, [fetchFeed]);

	return {
		posts,
		loading,
		error,
		createPost,
		refetch: fetchFeed,
	};
}
