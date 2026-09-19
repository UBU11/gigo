export async function apiRequest<T>(
	endpoint: string,
	options?: RequestInit,
): Promise<T> {
	const response = await fetch(endpoint, {
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
		...options,
	});

	if (!response.ok) {
		const errorData = await response
			.json()
			.catch(() => ({ error: "UNKNOWN_ERROR" }));
		throw new Error(errorData.error || `HTTP ${response.status}`);
	}

	return response.json() as Promise<T>;
}
