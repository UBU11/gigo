import type { ServerWebSocket } from "bun";
import { handlePong, type SocketContext } from "./heartbeat";

export const websocketHandlers = {
	open(ws: ServerWebSocket<SocketContext>) {
		ws.subscribe("heartbeat");
	},
	message(ws: ServerWebSocket<SocketContext>, message: string | Buffer) {
		const text = typeof message === "string" ? message : message.toString();
		try {
			const data = JSON.parse(text);
			if (data.type === "pong") {
				handlePong(ws);
			}
		} catch {
			// Ignore malformed WS messages
		}
	},
	close(ws: ServerWebSocket<SocketContext>) {
		ws.unsubscribe("heartbeat");
	},
};
