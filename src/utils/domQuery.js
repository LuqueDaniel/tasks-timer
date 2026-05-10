/**
 * Typed DOM query helpers for checkJs modules.
 */

/**
 * @template {Element} T
 * @param {ParentNode} root
 * @param {string} selector
 * @returns {T | null}
 */
export function queryOptional(root, selector) {
  return /** @type {T | null} */ (root.querySelector(selector));
}

/**
 * @template {Element} T
 * @param {ParentNode} root
 * @param {string} selector
 * @param {string} context
 * @returns {T}
 */
export function queryRequired(root, selector, context) {
  const node = root.querySelector(selector);
  if (!node) {
    throw new Error(`[Task Timer] Missing required node '${selector}' in ${context}`);
  }
  return /** @type {T} */ (node);
}
