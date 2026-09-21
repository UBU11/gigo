import type { CreateCollabPost } from "@campus/contracts";
import type React from "react";
import { useState } from "react";

interface CreateCollabFormProps {
	onSubmit: (payload: CreateCollabPost) => Promise<unknown>;
}

export function CreateCollabForm({
	onSubmit,
}: CreateCollabFormProps): React.JSX.Element {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [skillsInput, setSkillsInput] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedTitle = title.trim();
		const trimmedDesc = description.trim();

		if (trimmedTitle.length < 3) {
			setValidationError("Title must be at least 3 characters.");
			return;
		}

		if (trimmedDesc.length < 10) {
			setValidationError("Description must be at least 10 characters.");
			return;
		}

		const parsedSkills = skillsInput
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean)
			.slice(0, 10);

		setValidationError(null);
		setSubmitting(true);
		try {
			await onSubmit({
				title: trimmedTitle,
				description: trimmedDesc,
				requiredSkills: parsedSkills,
			});
			setTitle("");
			setDescription("");
			setSkillsInput("");
		} catch (err) {
			setValidationError(
				err instanceof Error ? err.message : "Failed to create project",
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
				Post Collaboration Project
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

			<input
				type="text"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder="Project Title (e.g. Autonomous Campus Delivery Drone)"
				maxLength={120}
				style={{
					padding: "0.5rem",
					borderRadius: "6px",
					border: "1px solid #d1d5db",
					fontSize: "0.875rem",
				}}
			/>

			<textarea
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				placeholder="Describe the project, scope, and objectives (min 10 characters)..."
				maxLength={4000}
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
					value={skillsInput}
					onChange={(e) => setSkillsInput(e.target.value)}
					placeholder="Required skills, comma-separated (e.g. React, PyTorch, PCB Design)"
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
					disabled={submitting || !title.trim() || !description.trim()}
					style={{
						padding: "0.5rem 1rem",
						borderRadius: "6px",
						border: "none",
						backgroundColor:
							submitting || !title.trim() || !description.trim()
								? "#93c5fd"
								: "#2563eb",
						color: "#ffffff",
						fontWeight: "500",
						cursor:
							submitting || !title.trim() || !description.trim()
								? "not-allowed"
								: "pointer",
					}}
				>
					{submitting ? "Publishing..." : "Publish Project"}
				</button>
			</div>
		</form>
	);
}
