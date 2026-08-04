import crypto from "crypto";

export function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = extractSignature(signature);
  if (!hash) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  if (expected.length !== hash.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(hash)
  );
}

export function extractSignature(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/sha256=([a-f0-9]+)/);
  return match ? match[1] : null;
}