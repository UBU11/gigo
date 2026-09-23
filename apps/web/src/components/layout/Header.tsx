import type { JSX } from "react";
import { useState } from "react";
import { authClient } from "../../lib/auth-client";

export type NavRoute = "home" | "tickets" | "feed" | "collab";

export interface HeaderProps {
	currentRoute?: NavRoute;
	onNavigate?: (route: NavRoute) => void;
}

const NAV_ITEMS: readonly { route: NavRoute; label: string }[] = [
	{ route: "home", label: "Home" },
	{ route: "tickets", label: "Tickets" },
	{ route: "feed", label: "Feed" },
	{ route: "collab", label: "Collab" },
];

export function Header({
	currentRoute,
	onNavigate,
}: HeaderProps = {}): JSX.Element {
	const { data: sessionData, isPending } = authClient.useSession();
	const [authError, setAuthError] = useState<string | null>(null);
	const [isAuthenticating, setIsAuthenticating] = useState(false);

	const handleSignIn = async () => {
		setAuthError(null);
		setIsAuthenticating(true);
		try {
			await authClient.signIn.social({
				provider: "google",
			});
		} catch (error) {
			setAuthError(
				error instanceof Error ? error.message : "Sign in failed. Try again.",
			);
		} finally {
			setIsAuthenticating(false);
		}
	};

	const handleSignOut = async () => {
		setAuthError(null);
		setIsAuthenticating(true);
		try {
			await authClient.signOut();
		} catch (error) {
			setAuthError(
				error instanceof Error ? error.message : "Sign out failed. Try again.",
			);
		} finally {
			setIsAuthenticating(false);
		}
	};

	return (
		<header
			style={{
				padding: "1rem 1.5rem",
				borderBottom: "1px solid #e5e7eb",
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
				<h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold" }}>
					Campus Core
				</h2>
				<nav style={{ display: "flex", gap: "1rem" }}>
					{NAV_ITEMS.map(({ route, label }) => (
						<button
							key={route}
							type="button"
							onClick={() => onNavigate?.(route)}
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								fontWeight: currentRoute === route ? "600" : "400",
								color: currentRoute === route ? "#2563eb" : "#4b5563",
							}}
						>
							{label}
						</button>
					))}
				</nav>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
				{authError && (
					<span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
						{authError}
					</span>
				)}
				{isPending ? (
					<span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
						Loading...
					</span>
				) : sessionData?.user ? (
					<div
						style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
					>
						<span style={{ fontSize: "0.875rem", color: "#374151" }}>
							{sessionData.user.name || sessionData.user.email}
						</span>
						<button
							type="button"
							onClick={handleSignOut}
							disabled={isAuthenticating}
							style={{
								padding: "0.4rem 0.8rem",
								borderRadius: "4px",
								border: "1px solid #d1d5db",
								background: "#fff",
								cursor: isAuthenticating ? "not-allowed" : "pointer",
								opacity: isAuthenticating ? 0.6 : 1,
							}}
						>
							{isAuthenticating ? "Signing out..." : "Sign Out"}
						</button>
					</div>
				) : (
					<button
						type="button"
						onClick={handleSignIn}
						disabled={isAuthenticating}
						style={{
							padding: "0.4rem 0.8rem",
							borderRadius: "4px",
							border: "none",
							background: "#2563eb",
							color: "#fff",
							cursor: isAuthenticating ? "not-allowed" : "pointer",
							opacity: isAuthenticating ? 0.6 : 1,
							fontWeight: "500",
						}}
					>
						{isAuthenticating ? "Connecting..." : "Sign in with Google"}
					</button>
				)}
			</div>
		</header>
	);
}
