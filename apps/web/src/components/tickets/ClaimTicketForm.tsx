import { ClaimTicketSchema } from "@campus/contracts";
import type { FormEvent, JSX } from "react";
import { useState } from "react";

interface ClaimTicketFormProps {
	onSubmit: (eventId: string) => Promise<unknown>;
}

export function ClaimTicketForm({
	onSubmit,
}: ClaimTicketFormProps): JSX.Element {
	const [eventId, setEventId] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const trimmedEventId = eventId.trim();

		const validation = ClaimTicketSchema.safeParse({ eventId: trimmedEventId });
		if (!validation.success) {
			setValidationError(
				"Please enter a valid Event UUID (e.g. 123e4567-e89b-12d3-a456-426614174000)",
			);
			return;
		}

		setValidationError(null);
		setSubmitting(true);
		try {
			await onSubmit(trimmedEventId);
			setEventId("");
		} catch (err) {
			setValidationError(
				err instanceof Error ? err.message : "Failed to claim ticket",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			style={{
				padding: "1rem",
				border: "1px solid #e5e7eb",
				borderRadius: "8px",
				backgroundColor: "#ffffff",
				display: "flex",
				flexDirection: "column",
				gap: "0.75rem",
			}}
		>
			<h4 style={{ margin: 0, fontSize: "1rem", color: "#111827" }}>
				Claim Event Ticket
			</h4>

			{validationError && (
				<div
					style={{
						padding: "0.5rem",
						borderRadius: "4px",
						backgroundColor: "#fee2e2",
						color: "#b91c1c",
						fontSize: "0.875rem",
					}}
				>
					{validationError}
				</div>
			)}

			<div style={{ display: "flex", gap: "0.5rem" }}>
				<input
					type="text"
					value={eventId}
					onChange={(e) => setEventId(e.target.value)}
					placeholder="Enter Event ID (UUID)"
					style={{
						flex: 1,
						padding: "0.5rem",
						borderRadius: "6px",
						border: "1px solid #d1d5db",
						fontSize: "0.875rem",
					}}
				/>
				<button
					type="submit"
					disabled={submitting || !eventId.trim()}
					style={{
						padding: "0.5rem 1rem",
						borderRadius: "6px",
						border: "none",
						backgroundColor:
							submitting || !eventId.trim() ? "#93c5fd" : "#2563eb",
						color: "#ffffff",
						fontWeight: "500",
						cursor: submitting || !eventId.trim() ? "not-allowed" : "pointer",
					}}
				>
					{submitting ? "Claiming..." : "Claim Ticket"}
				</button>
			</div>
		</form>
	);
}
