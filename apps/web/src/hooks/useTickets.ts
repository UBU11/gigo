import type { ClaimTicket, UserTicketDto } from "@campus/contracts";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api-client";

interface TicketsResponse {
	success: boolean;
	tickets: UserTicketDto[];
}

interface ClaimResponse {
	success: boolean;
	ticket: UserTicketDto;
}

export function useTickets() {
	const [tickets, setTickets] = useState<UserTicketDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchTickets = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await apiRequest<TicketsResponse>("/api/tickets");
			setTickets(res.tickets);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load tickets");
		} finally {
			setLoading(false);
		}
	}, []);

	const claimTicket = useCallback(
		async (eventId: string): Promise<UserTicketDto> => {
			const payload: ClaimTicket = { eventId };
			const res = await apiRequest<ClaimResponse>("/api/tickets/claim", {
				method: "POST",
				body: JSON.stringify(payload),
			});
			setTickets((prev) => [res.ticket, ...prev]);
			return res.ticket;
		},
		[],
	);

	useEffect(() => {
		void fetchTickets();
	}, [fetchTickets]);

	return {
		tickets,
		loading,
		error,
		claimTicket,
		refetch: fetchTickets,
	};
}
