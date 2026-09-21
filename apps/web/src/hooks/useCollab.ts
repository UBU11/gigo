import type { CollabPostDto, CreateCollabPost } from "@campus/contracts";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api-client";

interface CollabResponse {
	projects: CollabPostDto[];
}

interface CreateCollabResponse {
	success: boolean;
	collab: CollabPostDto;
}

export function useCollab() {
	const [projects, setProjects] = useState<CollabPostDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchProjects = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await apiRequest<CollabResponse>("/api/collab");
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
			const res = await apiRequest<CreateCollabResponse>("/api/collab", {
				method: "POST",
				body: JSON.stringify(payload),
			});
			setProjects((prev) => [res.collab, ...prev]);
			return res.collab;
		},
		[],
	);

	useEffect(() => {
		void fetchProjects();
	}, [fetchProjects]);

	return {
		projects,
		loading,
		error,
		createProject,
		refetch: fetchProjects,
	};
}
