import {
	type CollabListResponse,
	type CollabPostDto,
	type CreateCollabPost,
	CreateCollabPostSchema,
	type CreateCollabResponse,
} from "@campus/contracts";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api-client";

export function useCollab() {
	const [projects, setProjects] = useState<CollabPostDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchProjects = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await apiRequest<CollabListResponse>("/api/collab");
			setProjects(res.projects);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load collab projects",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	const createProject = useCallback(
		async (payload: CreateCollabPost): Promise<CollabPostDto> => {
			const validation = CreateCollabPostSchema.safeParse(payload);
			if (!validation.success) {
				const errorMessage =
					validation.error.issues[0]?.message || "Invalid collaboration post";
				setError(errorMessage);
				throw new Error(errorMessage);
			}

			setCreating(true);
			setError(null);
			try {
				const res = await apiRequest<CreateCollabResponse>("/api/collab", {
					method: "POST",
					body: JSON.stringify(validation.data),
				});
				setProjects((prev) => [res.collab, ...prev]);
				return res.collab;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to create project";
				setError(errorMessage);
				throw err;
			} finally {
				setCreating(false);
			}
		},
		[],
	);

	useEffect(() => {
		void fetchProjects();
	}, [fetchProjects]);

	return {
		projects,
		loading,
		creating,
		error,
		createProject,
		refetch: fetchProjects,
	};
}
