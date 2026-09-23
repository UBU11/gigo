import type { FeedPostDto } from "@campus/contracts";
import type { JSX } from "react";

interface FeedCardProps {
	post: FeedPostDto;
}

export function FeedCard({ post }: FeedCardProps): JSX.Element {
	const parsedDate = new Date(post.createdAt);
	const formattedDate = Number.isNaN(parsedDate.getTime())
		? "Unknown date"
		: parsedDate.toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
	const avatarSeed = (post.authorAvatarSeed || "??").slice(0, 2).toUpperCase();
	const upvotes = typeof post.upvotes === "number" ? post.upvotes : 0;

	return (
		<article
			style={{
				padding: "1rem",
				border: "1px solid #e5e7eb",
				borderRadius: "8px",
				backgroundColor: "#ffffff",
				display: "flex",
				flexDirection: "column",
				gap: "0.5rem",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
					<span
						style={{
							width: "24px",
							height: "24px",
							borderRadius: "50%",
							backgroundColor: "#e0e7ff",
							color: "#3730a3",
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "0.75rem",
							fontWeight: "bold",
						}}
					>
						{avatarSeed}
					</span>
					<strong style={{ fontSize: "0.875rem", color: "#1f2937" }}>
						{post.authorPseudoHandle}
					</strong>
					{post.tag && (
						<span
							style={{
								padding: "0.15rem 0.5rem",
								borderRadius: "9999px",
								backgroundColor: "#f3f4f6",
								color: "#4b5563",
								fontSize: "0.75rem",
							}}
						>
							#{post.tag}
						</span>
					)}
				</div>
				<time style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
					{formattedDate}
				</time>
			</div>

			<p
				style={{
					margin: "0.25rem 0",
					color: "#374151",
					whiteSpace: "pre-wrap",
				}}
			>
				{post.content}
			</p>

			<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
				<span
					style={{
						fontSize: "0.75rem",
						color: "#6b7280",
						display: "inline-flex",
						alignItems: "center",
						gap: "0.25rem",
					}}
				>
					▲ {upvotes} {upvotes === 1 ? "upvote" : "upvotes"}
				</span>
			</div>
		</article>
	);
}
