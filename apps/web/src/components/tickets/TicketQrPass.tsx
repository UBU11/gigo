import type { UserTicketDto } from "@campus/contracts";
import QRCode from "qrcode";
import type React from "react";
import { useEffect, useState } from "react";
import { StatusBadge } from "../common/StatusBadge";

interface TicketQrPassProps {
	ticket: UserTicketDto;
	onClose?: () => void;
}

export function TicketQrPass({
	ticket,
	onClose,
}: TicketQrPassProps): React.JSX.Element {
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const [generationError, setGenerationError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		QRCode.toDataURL(ticket.signedToken, {
			width: 220,
			margin: 2,
			errorCorrectionLevel: "M",
		})
			.then((url) => {
				if (isMounted) setQrDataUrl(url);
			})
			.catch((err) => {
				if (isMounted) {
					setGenerationError(
						err instanceof Error ? err.message : "Failed to generate QR code",
					);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [ticket.signedToken]);

	return (
		<div
			style={{
				padding: "1.25rem",
				border: "1px solid #d1d5db",
				borderRadius: "10px",
				backgroundColor: "#ffffff",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "0.75rem",
				boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
			}}
		>
			<div
				style={{
					width: "100%",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div>
					<h4 style={{ margin: 0, fontSize: "1rem", color: "#111827" }}>
						Event Admission Pass
					</h4>
					<small style={{ color: "#6b7280" }}>
						Ticket #{ticket.id.slice(0, 8)}
					</small>
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
					<StatusBadge status={ticket.status} />
					{onClose && (
						<button
							type="button"
							onClick={onClose}
							style={{
								border: "none",
								background: "none",
								fontSize: "1.2rem",
								cursor: "pointer",
								color: "#9ca3af",
							}}
							aria-label="Close QR pass"
						>
							×
						</button>
					)}
				</div>
			</div>

			{generationError && (
				<p style={{ color: "#b91c1c", fontSize: "0.875rem" }}>
					{generationError}
				</p>
			)}

			{qrDataUrl ? (
				<img
					src={qrDataUrl}
					alt={`QR Pass for Ticket ${ticket.id}`}
					style={{
						width: "220px",
						height: "220px",
						borderRadius: "8px",
						border: "1px solid #f3f4f6",
					}}
				/>
			) : (
				<div
					style={{
						width: "220px",
						height: "220px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "#9ca3af",
						backgroundColor: "#f9fafb",
						borderRadius: "8px",
					}}
				>
					Rendering QR Pass...
				</div>
			)}

			<div
				style={{
					textAlign: "center",
					display: "flex",
					flexDirection: "column",
					gap: "0.25rem",
				}}
			>
				<span
					style={{
						fontSize: "0.75rem",
						fontWeight: "600",
						color: "#059669",
						backgroundColor: "#ecfdf5",
						padding: "0.2rem 0.5rem",
						borderRadius: "4px",
					}}
				>
					Ed25519 Cryptographically Signed
				</span>
				<small
					style={{
						color: "#6b7280",
						fontFamily: "monospace",
						fontSize: "0.7rem",
						wordBreak: "break-all",
					}}
				>
					Token: {ticket.signedToken.slice(0, 24)}...
				</small>
			</div>
		</div>
	);
}
