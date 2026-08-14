/**
 * Host-side entry required by the DeepSeek Harness Cordis loader.
 *
 * The skin itself is browser-only and is loaded through the package's
 * `dsh.client` metadata and `./client` export.  The loader still imports the
 * package root while assembling the host plugin tree, so expose a deliberate
 * no-op plugin here instead of running browser code in Node.js.
 */
export function apply() {}
