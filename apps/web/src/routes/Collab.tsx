import type React from "react";
import { CollabCard } from "../components/collab/CollabCard";
import { CreateCollabForm } from "../components/collab/CreateCollabForm";
import { useCollab } from "../hooks/useCollab";

export function Collab(): React.JSX.Element {
	const { projects, loading, error, createProject } = useCollab();

	return (
		<main
			style={{
				padding: "1.5rem",
				maxWidth: "760px",
				margin: "0 auto",
				display: "flex",
				flexDirection: "column",
				gap: "1.5rem",
			}}
		>
			<header>
				<h3 style={{ margin: "0 0 0.25rem 0", color: "#111827" }}>
					Peer Collaboration & Projects
				</h3>
				<p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
					Discover campus projects and recruit student teammates.
				</p>
			</header>

			<CreateCollabForm onSubmit={createProject} />

			{error && (
				<div
					style={{
						padding: "0.75rem",
						borderRadius: "6px",
						backgroundColor: "#fee2e2",
						color: "#b91c1c",
						fontSize: "0.875rem",
					}}
				>
					{error}
				</div>
			)}

			{loading && (
				<p style={{ color: "#6b7280", textAlign: "center" }}>
					Loading collaboration projects...
				</p>
			)}

			{!loading && projects.length === 0 && (
				<p
					style={{
						color: "#6b7280",
						textAlign: "center",
						padding: "2rem 0",
						border: "1px dashed #e5e7eb",
						borderRadius: "8px",
					}}
				>
					No collaboration projects yet. Start one above!
				</p>
			)}

			<section
				style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
			>
				{projects.map((project) => (
					<CollabCard key={project.id} project={project} />
				))}
			</section>
		</main>
	);
}
