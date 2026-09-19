import type React from "react";
import { useState } from "react";
import { Header } from "./components/layout/Header";
import { Feed } from "./routes/Feed";
import { Home } from "./routes/Home";
import { Tickets } from "./routes/Tickets";

export function App(): React.JSX.Element {
	const [route, setRoute] = useState<"home" | "tickets" | "feed">("home");

	return (
		<div>
			<Header />
			<div style={{ display: "flex", gap: "10px", padding: "1rem" }}>
				<button type="button" onClick={() => setRoute("home")}>
					Home
				</button>
				<button type="button" onClick={() => setRoute("tickets")}>
					Tickets
				</button>
				<button type="button" onClick={() => setRoute("feed")}>
					Feed
				</button>
			</div>
			{route === "home" && <Home />}
			{route === "tickets" && <Tickets />}
			{route === "feed" && <Feed />}
		</div>
	);
}
