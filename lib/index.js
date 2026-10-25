/**
 * Host half of the bundle.
 *
 * The feature itself lives in `lib/client.js`, which runs inside the Web GUI
 * page where the tab strip is. This module exists so the package is a real
 * plugin row (visible, configurable and disable-able in the plugin list)
 * instead of an invisible client-only sidecar; there is nothing to do on the
 * Host side, and an empty `apply` keeps the row active rather than pending.
 */
export function apply() {}
