import {
	type TicketTokenPayload,
	TicketTokenPayloadSchema,
} from "@campus/contracts";

export async function signTicket(
	payload: TicketTokenPayload,
	privateKeyPkcs8: Uint8Array,
): Promise<string> {
	const privateKey = await crypto.subtle.importKey(
		"pkcs8",
		privateKeyPkcs8 as BufferSource,
		{ name: "Ed25519" },
		false,
		["sign"],
	);

	const rawData = new TextEncoder().encode(JSON.stringify(payload));
	const signature = await crypto.subtle.sign("Ed25519", privateKey, rawData);

	const dataPart = Buffer.from(rawData).toString("base64url");
	const sigPart = Buffer.from(signature).toString("base64url");

	return `${dataPart}.${sigPart}`;
}

export async function verifyTicket(
	compactToken: string,
	publicKeySpki: Uint8Array,
): Promise<{ valid: boolean; payload?: TicketTokenPayload }> {
	try {
		const [dataPart, sigPart] = compactToken.split(".");
		if (!dataPart || !sigPart) {
			return { valid: false };
		}

		const publicKey = await crypto.subtle.importKey(
			"spki",
			publicKeySpki as BufferSource,
			{ name: "Ed25519" },
			false,
			["verify"],
		);

		const rawData = Buffer.from(dataPart, "base64url");
		const signature = Buffer.from(sigPart, "base64url");

		const isValid = await crypto.subtle.verify(
			"Ed25519",
			publicKey,
			signature,
			rawData,
		);
		if (!isValid) {
			return { valid: false };
		}

		const jsonText = new TextDecoder().decode(rawData);
		const parsed = TicketTokenPayloadSchema.safeParse(JSON.parse(jsonText));
		if (!parsed.success) {
			return { valid: false };
		}

		const nowSeconds = Math.floor(Date.now() / 1000);
		if (parsed.data.exp < nowSeconds) {
			return { valid: false };
		}

		return { valid: true, payload: parsed.data };
	} catch {
		return { valid: false };
	}
}
