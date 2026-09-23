import type { UserTicketDto } from "@campus/contracts";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBadge } from "../common/StatusBadge";
import { TicketQrPass } from "./TicketQrPass";

interface TicketItemProps {
	ticket: UserTicketDto;
}

export function TicketItem({ ticket }: TicketItemProps): JSX.Element {
	const [showPass, setShowPass] = useState(false);

	const parsedDate = new Date(ticket.createdAt);
	const formattedDate = Number.isNaN(parsedDate.getTime())
		? "Unknown date"
		: parsedDate.toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			});

	return (
		<li
			style={{
				border: "1px solid #e5e7eb",
				borderRadius: "8px",
				backgroundColor: "#ffffff",
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div
				style={{
					padding: "1rem 1.25rem",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "1rem",
				}}
			>
				<div>
					<p
						style={{
							margin: "0 0 0.25rem 0",
							fontWeight: "600",
							color: "#111827",
						}}
					>
						Ticket #{ticket.id.slice(0, 8)}
					</p>
					<small style={{ color: "#6b7280" }}>Claimed: {formattedDate}</small>
				</div>

				<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
					<StatusBadge status={ticket.status} />
					<button
						type="button"
						onClick={() => setShowPass((prev) => !prev)}
						style={{
							padding: "0.4rem 0.8rem",
							borderRadius: "6px",
							border: "1px solid #d1d5db",
							backgroundColor: showPass ? "#f3f4f6" : "#ffffff",
							color: "#374151",
							fontSize: "0.875rem",
							fontWeight: "500",
							cursor: "pointer",
						}}
					>
						{showPass ? "Hide QR" : "Show QR Pass"}
					</button>
				</div>
			</div>

			{showPass && (
				<div
					style={{
						padding: "1rem",
						backgroundColor: "#f9fafb",
						borderTop: "1px solid #e5e7eb",
						display: "flex",
						justifyContent: "center",
					}}
				>
					<div style={{ maxWidth: "320px", width: "100%" }}>
						<TicketQrPass ticket={ticket} onClose={() => setShowPass(false)} />
					</div>
				</div>
			)}
		</li>
	);
}
