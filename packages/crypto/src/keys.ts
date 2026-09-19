export async function generateTicketKeyPair(): Promise<{
	privateKeyPkcs8: Uint8Array;
	publicKeySpki: Uint8Array;
}> {
	const keyPair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
		"sign",
		"verify",
	])) as CryptoKeyPair;

	const privateKeyExport = await crypto.subtle.exportKey(
		"pkcs8",
		keyPair.privateKey,
	);
	const publicKeyExport = await crypto.subtle.exportKey(
		"spki",
		keyPair.publicKey,
	);

	return {
		privateKeyPkcs8: new Uint8Array(privateKeyExport),
		publicKeySpki: new Uint8Array(publicKeyExport),
	};
}
