import type React from "react";

export function Header(): React.JSX.Element {
	return (
		<header
			style={{
				padding: "1rem",
				borderBottom: "1px solid #e5e7eb",
				display: "flex",
				justifyContent: "space-between",
			}}
		>
			<h2>Campus Core</h2>
			<nav style={{ display: "flex", gap: "1rem" }}>
				<a href="/">Home</a>
				<a href="/tickets">Tickets</a>
				<a href="/feed">Feed</a>
			</nav>
		</header>
	);
}
