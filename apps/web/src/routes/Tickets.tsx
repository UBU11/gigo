import type React from "react";
import { TicketItem } from "../components/tickets/TicketItem";
import { useTickets } from "../hooks/useTickets";

export function Tickets(): React.JSX.Element {
	const { tickets, loading, error } = useTickets();

	return (
		<main
			style={{
				padding: "1.5rem",
				maxWidth: "680px",
				margin: "0 auto",
				display: "flex",
				flexDirection: "column",
				gap: "1.5rem",
			}}
		>
			<header>
				<h3 style={{ margin: "0 0 0.25rem 0", color: "#111827" }}>
					Your Event Tickets
				</h3>
				<p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
					Cryptographically signed Ed25519 digital passes for campus admission.
				</p>
			</header>

			{error && (
				<div
					style={{
						padding: "0.75rem",
						borderRadius: "6px",
						backgroundColor: "#fee2e2",
						color: "#b91c1c",
						fontSize: "0.875rem",
					}}
				>
					{error}
				</div>
			)}

			{loading && (
				<p style={{ color: "#6b7280", textAlign: "center" }}>
					Loading tickets...
				</p>
			)}

			{!loading && tickets.length === 0 && (
				<p
					style={{
						color: "#6b7280",
						textAlign: "center",
						padding: "2rem 0",
						border: "1px dashed #e5e7eb",
						borderRadius: "8px",
					}}
				>
					No tickets claimed yet.
				</p>
			)}

			<ul
				style={{
					listStyle: "none",
					padding: 0,
					margin: 0,
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
				}}
			>
				{tickets.map((ticket) => (
					<TicketItem key={ticket.id} ticket={ticket} />
				))}
			</ul>
		</main>
	);
}
