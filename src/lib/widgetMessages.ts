// Exact-match origin check for postMessage handlers on both sides of the
// main-app <-> widget iframe boundary. No wildcard/prefix matching - an
// exact string match is the only safe way to validate a postMessage origin.
export function isTrustedOrigin(origin: string, allowed: string): boolean {
  return origin === allowed
}
