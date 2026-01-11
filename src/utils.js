/**
 * Returns a reasonably collision-resistant id.
 * Prefers `crypto.randomUUID()` when available.
 */
export function safeUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `t_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
