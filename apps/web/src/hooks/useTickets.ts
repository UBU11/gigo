import {
	type ClaimTicket,
	type ClaimTicketResponse,
	ClaimTicketSchema,
	type UserTicketDto,
	type UserTicketsResponse,
} from "@campus/contracts";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api-client";

export function useTickets() {
	const [tickets, setTickets] = useState<UserTicketDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [claiming, setClaiming] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchTickets = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await apiRequest<UserTicketsResponse>("/api/tickets");
			setTickets(res.tickets);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load tickets");
		} finally {
			setLoading(false);
		}
	}, []);

	const claimTicket = useCallback(
		async (eventId: string): Promise<UserTicketDto> => {
			const validation = ClaimTicketSchema.safeParse({
				eventId: eventId.trim(),
			});
			if (!validation.success) {
				const errorMessage =
					validation.error.issues[0]?.message || "Invalid event ID format";
				setError(errorMessage);
				throw new Error(errorMessage);
			}

			setClaiming(true);
			setError(null);
			try {
				const payload: ClaimTicket = validation.data;
				const res = await apiRequest<ClaimTicketResponse>(
					"/api/tickets/claim",
					{
						method: "POST",
						body: JSON.stringify(payload),
					},
				);
				setTickets((prev) => [res.ticket, ...prev]);
				return res.ticket;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to claim ticket";
				setError(errorMessage);
				throw err;
			} finally {
				setClaiming(false);
			}
		},
		[],
	);

	useEffect(() => {
		void fetchTickets();
	}, [fetchTickets]);

	return {
		tickets,
		loading,
		claiming,
		error,
		claimTicket,
		refetch: fetchTickets,
	};
}
