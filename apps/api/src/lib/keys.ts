import { generateTicketKeyPair } from "@campus/crypto";
import { env } from "./env";

interface TicketKeyPair {
	privateKeyPkcs8: Uint8Array;
	publicKeySpki: Uint8Array;
}

let cachedKeyPair: TicketKeyPair | null = null;

export async function getTicketKeys(): Promise<TicketKeyPair> {
	if (cachedKeyPair) {
		return cachedKeyPair;
	}

	if (env.TICKET_SIGNING_PRIVATE_KEY && env.TICKET_VERIFY_PUBLIC_KEY) {
		cachedKeyPair = {
			privateKeyPkcs8: new Uint8Array(
				Buffer.from(env.TICKET_SIGNING_PRIVATE_KEY, "base64"),
			),
			publicKeySpki: new Uint8Array(
				Buffer.from(env.TICKET_VERIFY_PUBLIC_KEY, "base64"),
			),
		};
		return cachedKeyPair;
	}

	// Fallback to ephemeral keypair for development and testing
	cachedKeyPair = await generateTicketKeyPair();
	return cachedKeyPair;
}
