import type { JSX } from "react";
import { CreatePostForm } from "../components/feed/CreatePostForm";
import { FeedCard } from "../components/feed/FeedCard";
import { useFeed } from "../hooks/useFeed";

export function Feed(): JSX.Element {
	const { posts, loading, error, createPost, refetch } = useFeed();

	return (
		<main
			style={{
				padding: "1.5rem",
				maxWidth: "680px",
				margin: "0 auto",
				display: "flex",
				flexDirection: "column",
				gap: "1.5rem",
			}}
		>
			<header>
				<h3 style={{ margin: "0 0 0.25rem 0", color: "#111827" }}>
					Campus Discussion Feed
				</h3>
				<p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
					Anonymous, pseudonymous campus community board.
				</p>
			</header>

			<CreatePostForm onSubmit={createPost} />

			{error && (
				<div
					style={{
						padding: "0.75rem",
						borderRadius: "6px",
						backgroundColor: "#fee2e2",
						color: "#b91c1c",
						fontSize: "0.875rem",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<span>{error}</span>
					<button
						type="button"
						onClick={() => void refetch()}
						style={{
							padding: "0.25rem 0.5rem",
							borderRadius: "4px",
							border: "1px solid #b91c1c",
							backgroundColor: "#ffffff",
							color: "#b91c1c",
							fontSize: "0.75rem",
							cursor: "pointer",
						}}
					>
						Retry
					</button>
				</div>
			)}

			{loading && (
				<p style={{ color: "#6b7280", textAlign: "center" }}>
					Loading posts...
				</p>
			)}

			{!loading && posts.length === 0 && (
				<p
					style={{
						color: "#6b7280",
						textAlign: "center",
						padding: "2rem 0",
						border: "1px dashed #e5e7eb",
						borderRadius: "8px",
					}}
				>
					No posts yet. Be the first to start a discussion!
				</p>
			)}

			<section
				style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
			>
				{posts.map((post) => (
					<FeedCard key={post.id} post={post} />
				))}
			</section>
		</main>
	);
}
