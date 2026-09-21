import type React from "react";
import { useState } from "react";
import { Header, type NavRoute } from "./components/layout/Header";
import { Collab } from "./routes/Collab";
import { Feed } from "./routes/Feed";
import { Home } from "./routes/Home";
import { Tickets } from "./routes/Tickets";

export function App(): React.JSX.Element {
	const [route, setRoute] = useState<NavRoute>("home");

	return (
		<div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
			<Header currentRoute={route} onNavigate={setRoute} />
			{route === "home" && <Home />}
			{route === "tickets" && <Tickets />}
			{route === "feed" && <Feed />}
			{route === "collab" && <Collab />}
		</div>
	);
}
