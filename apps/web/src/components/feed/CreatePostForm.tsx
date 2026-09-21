import type { CreateFeedPost } from "@campus/contracts";
import type React from "react";
import { useState } from "react";

interface CreatePostFormProps {
	onSubmit: (payload: CreateFeedPost) => Promise<unknown>;
}

export function CreatePostForm({
	onSubmit,
}: CreatePostFormProps): React.JSX.Element {
	const [content, setContent] = useState("");
	const [tag, setTag] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedContent = content.trim();
		if (!trimmedContent) {
			setValidationError("Post content cannot be empty.");
			return;
		}

		setValidationError(null);
		setSubmitting(true);
		try {
			const payload: CreateFeedPost = {
				content: trimmedContent,
				...(tag.trim() ? { tag: tag.trim() } : {}),
			};
			await onSubmit(payload);
			setContent("");
			setTag("");
		} catch (err) {
			setValidationError(
				err instanceof Error ? err.message : "Failed to create post",
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
				Create Anonymous Post
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

			<textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				placeholder="What's happening on campus? (Anonymous)"
				maxLength={2000}
				rows={3}
				style={{
					width: "100%",
					boxSizing: "border-box",
					padding: "0.5rem",
					borderRadius: "6px",
					border: "1px solid #d1d5db",
					fontFamily: "inherit",
					fontSize: "0.875rem",
					resize: "vertical",
				}}
			/>

			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "0.75rem",
				}}
			>
				<input
					type="text"
					value={tag}
					onChange={(e) => setTag(e.target.value)}
					placeholder="Tag (e.g. hackathon, hostel)"
					maxLength={30}
					style={{
						flex: 1,
						padding: "0.4rem 0.6rem",
						borderRadius: "6px",
						border: "1px solid #d1d5db",
						fontSize: "0.875rem",
					}}
				/>

				<button
					type="submit"
					disabled={submitting || !content.trim()}
					style={{
						padding: "0.5rem 1rem",
						borderRadius: "6px",
						border: "none",
						backgroundColor:
							submitting || !content.trim() ? "#93c5fd" : "#2563eb",
						color: "#ffffff",
						fontWeight: "500",
						cursor: submitting || !content.trim() ? "not-allowed" : "pointer",
					}}
				>
					{submitting ? "Posting..." : "Post"}
				</button>
			</div>
		</form>
	);
}
