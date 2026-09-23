import type { ApiErrorResponse } from "@campus/contracts";

export class ApiClientError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly details?: unknown,
	) {
		super(message);
		this.name = "ApiClientError";
	}
}

export async function apiRequest<T>(
	endpoint: string,
	options?: RequestInit,
): Promise<T> {
	let response: Response;
	try {
		response = await fetch(endpoint, {
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				...options?.headers,
			},
			...options,
		});
	} catch (error) {
		// ponytail: normalize network connection failures without external libraries
		const message =
			error instanceof Error ? error.message : "Network request failed";
		throw new ApiClientError(message, 0);
	}

	if (!response.ok) {
		const errorPayload = (await response
			.json()
			.catch(() => null)) as Partial<ApiErrorResponse> | null;
		const message =
			errorPayload?.error ||
			`HTTP ${response.status} ${response.statusText}`.trim();
		throw new ApiClientError(message, response.status, errorPayload?.details);
	}

	return response.json() as Promise<T>;
}
