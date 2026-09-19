import { Hono } from "hono";
import { env } from "./lib/env";
import { errorHandler } from "./middleware/error";
import { authRoutes } from "./modules/auth/routes";
import { collabRoutes } from "./modules/collab/routes";
import { feedRoutes } from "./modules/feed/routes";
import { ticketRoutes } from "./modules/tickets/routes";
import { websocketHandlers } from "./ws/handlers";
import { type SocketContext, startHeartbeatSweeper } from "./ws/heartbeat";

const app = new Hono();

app.onError(errorHandler);

app.get("/health", (c) =>
	c.json({ status: "ok", timestamp: new Date().toISOString() }),
);
app.route("/api/auth", authRoutes);
app.route("/api/tickets", ticketRoutes);
app.route("/api/feed", feedRoutes);
app.route("/api/collab", collabRoutes);

const server = Bun.serve<SocketContext>({
	port: env.PORT,
	fetch(req, serverInstance) {
		if (
			serverInstance.upgrade(req, {
				data: { userId: "anonymous", isAlive: true },
			})
		) {
			return undefined;
		}
		return app.fetch(req);
	},
	websocket: websocketHandlers,
});

startHeartbeatSweeper(server);

console.log(
	`[CAMPUS CORE API] Server listening on http://localhost:${server.port}`,
);
