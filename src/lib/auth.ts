export const AUTH_COOKIE = "dlsu_auth";

// Web Crypto (not Node's `crypto` module) so this works in both the Edge
// middleware and the Node.js API route without needing two implementations.
export async function expectedToken() {
  const data = new TextEncoder().encode(`${process.env.PASSCODE}:${process.env.AUTH_SECRET}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
