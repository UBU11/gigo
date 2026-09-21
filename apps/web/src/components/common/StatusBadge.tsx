interface StatusBadgeProps {
	status: "ISSUED" | "CHECKED_IN" | "CANCELLED";
}

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
	const colors = {
		ISSUED: "#2563eb",
		CHECKED_IN: "#16a34a",
		CANCELLED: "#dc2626",
	};

	return (
		<span
			style={{
				backgroundColor: colors[status],
				color: "#fff",
				padding: "0.2rem 0.5rem",
				borderRadius: "4px",
			}}
		>
			{status}
		</span>
	);
}
