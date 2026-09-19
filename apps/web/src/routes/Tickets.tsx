import type React from "react";
import { StatusBadge } from "../components/common/StatusBadge";

export function Tickets(): React.JSX.Element {
	return (
		<main style={{ padding: "1rem" }}>
			<h3>Your Event Tickets</h3>
			<div>
				<p>Annual Tech Fest 2026</p>
				<StatusBadge status="ISSUED" />
			</div>
		</main>
	);
}
