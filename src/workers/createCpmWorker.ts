/**
 * Constructs the CPM web worker from its module URL, returning null when the
 * environment provides no Worker (jsdom, SSR) so the store can fall back to a
 * synchronous recompute. Isolated in its own module so the store can mock worker
 * creation in tests that exercise the asynchronous delta-sequencing path.
 */
export function createCpmWorker(): Worker | null {
    try {
        return new Worker(new URL("./cpmWorker.ts", import.meta.url), { type: "module" });
    } catch {
        return null;
    }
}
