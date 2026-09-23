import type { CollabPostDto } from "@campus/contracts";
import type { JSX } from "react";

interface CollabCardProps {
	project: CollabPostDto;
}

export function CollabCard({ project }: CollabCardProps): JSX.Element {
	const parsedDate = new Date(project.createdAt);
	const formattedDate = Number.isNaN(parsedDate.getTime())
		? "Unknown date"
		: parsedDate.toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
	const skills = Array.isArray(project.requiredSkills)
		? project.requiredSkills
		: [];

	return (
		<article
			style={{
				padding: "1.25rem",
				border: "1px solid #e5e7eb",
				borderRadius: "8px",
				backgroundColor: "#ffffff",
				display: "flex",
				flexDirection: "column",
				gap: "0.75rem",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					gap: "1rem",
				}}
			>
				<div>
					<h4
						style={{
							margin: "0 0 0.25rem 0",
							color: "#111827",
							fontSize: "1.1rem",
						}}
					>
						{project.title}
					</h4>
					<small style={{ color: "#6b7280" }}>
						By {project.ownerFullName} • {project.ownerDepartment}
					</small>
				</div>
				<time
					style={{
						fontSize: "0.75rem",
						color: "#9ca3af",
						whiteSpace: "nowrap",
					}}
				>
					{formattedDate}
				</time>
			</div>

			<p
				style={{
					margin: 0,
					color: "#374151",
					fontSize: "0.9rem",
					lineHeight: 1.5,
				}}
			>
				{project.description}
			</p>

			{skills.length > 0 && (
				<div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
					{skills.map((skill) => (
						<span
							key={skill}
							style={{
								padding: "0.2rem 0.6rem",
								borderRadius: "4px",
								backgroundColor: "#eff6ff",
								color: "#1d4ed8",
								fontSize: "0.75rem",
								fontWeight: "500",
							}}
						>
							{skill}
						</span>
					))}
				</div>
			)}
		</article>
	);
}
