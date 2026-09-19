import { describe, expect, it } from "bun:test";
import type { ServerWebSocket } from "bun";
import {
	handlePong,
	type SocketContext,
	setupKeepAlive,
	startHeartbeatSweeper,
} from "../src/ws/heartbeat";

describe("API Backend Core", () => {
	it("sets up and updates keepAlive status", () => {
		const fakeWs = {
			data: { userId: "test-user", isAlive: false } as SocketContext,
		} as ServerWebSocket<SocketContext>;

		setupKeepAlive(fakeWs);
		expect(fakeWs.data.isAlive).toBe(true);

		fakeWs.data.isAlive = false;
		handlePong(fakeWs);
		expect(fakeWs.data.isAlive).toBe(true);
	});

	it("initializes heartbeat sweeper interval", () => {
		const fakeWss = {
			publish: (_channel: string, _msg: string) => {},
		};

		const timer = startHeartbeatSweeper(fakeWss);
		clearInterval(timer);
		expect(timer).toBeDefined();
	});
});
