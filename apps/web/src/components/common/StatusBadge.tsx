import type { TicketStatus } from "@campus/contracts";
import type { JSX } from "react";

interface StatusBadgeProps {
	status: TicketStatus;
}

const STATUS_COLORS: Record<TicketStatus, string> = {
	ISSUED: "#2563eb",
	CHECKED_IN: "#16a34a",
	CANCELLED: "#dc2626",
};

export function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
	const backgroundColor = STATUS_COLORS[status] || "#6b7280";

	return (
		<span
			style={{
				backgroundColor,
				color: "#ffffff",
				padding: "0.2rem 0.5rem",
				borderRadius: "4px",
				fontFamily: "monospace",
				fontSize: "0.75rem",
				fontWeight: "600",
			}}
		>
			{status}
		</span>
	);
}
