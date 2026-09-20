import type { UserTicketDto } from "@campus/contracts";
import type React from "react";
import { useEffect, useState } from "react";
import { StatusBadge } from "../components/common/StatusBadge";
import { apiRequest } from "../lib/api-client";

export function Tickets(): React.JSX.Element {
	// ponytail: minimal client state for tickets fetching and rendering
	const [tickets, setTickets] = useState<UserTicketDto[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		apiRequest<{ success: boolean; tickets: UserTicketDto[] }>("/api/tickets")
			.then((res) => {
				setTickets(res.tickets);
				setLoading(false);
			})
			.catch(() => {
				setLoading(false);
			});
	}, []);

	return (
		<main style={{ padding: "1rem" }}>
			<h3>Your Event Tickets</h3>
			{loading && <p>Loading tickets...</p>}
			{!loading && tickets.length === 0 && <p>No tickets claimed yet.</p>}
			<ul
				style={{
					listStyle: "none",
					padding: 0,
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
				}}
			>
				{tickets.map((ticket) => (
					<li
						key={ticket.id}
						style={{
							padding: "1rem",
							border: "1px solid #e5e7eb",
							borderRadius: "6px",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<div>
							<p style={{ margin: 0, fontWeight: "bold" }}>Pass: {ticket.id}</p>
							<small style={{ color: "#6b7280" }}>
								Issued: {new Date(ticket.createdAt).toLocaleDateString()}
							</small>
						</div>
						<StatusBadge status={ticket.status} />
					</li>
				))}
			</ul>
		</main>
	);
}
