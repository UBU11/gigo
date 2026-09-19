import type { ServerWebSocket } from "bun";

export interface SocketContext {
	userId: string;
	isAlive: boolean;
}

export function setupKeepAlive(ws: ServerWebSocket<SocketContext>) {
	ws.data.isAlive = true;
}

export function handlePong(ws: ServerWebSocket<SocketContext>) {
	ws.data.isAlive = true;
}

// 30-second ping sweeper defending against Cloudflare 100-second idle disconnects
export function startHeartbeatSweeper(wss: {
	publish: (channel: string, message: string) => void;
}) {
	return setInterval(() => {
		wss.publish("heartbeat", JSON.stringify({ type: "ping" }));
	}, 30_000);
}
