/**
 * Shared typing for the DEV-only window.__scheduleStore handle that main.tsx
 * exposes in development. Specs drive edits through this handle (real DHTMLX drag
 * and AG-Grid typing are unreliable over thousands of virtualized rows) and read
 * the authoritative computed cache to assert downstream propagation. Type-only:
 * these annotations are erased, so importing them into page.evaluate callbacks is
 * safe.
 */
export interface ComputedSnapshot {
    earlyFinish: number;
    earlyStart: number;
    isCritical: boolean;
}

export interface ScheduleStoreWindow {
    __scheduleStore?: {
        getState(): {
            collapsed: Set<string>;
            computed: Map<string, ComputedSnapshot>;
            graph: {
                activities: {
                    durationDays: number;
                    id: string;
                    parentId: string | null;
                    type: string;
                }[];
                dependencies: { id: string; predecessorId: string; successorId: string }[];
            };
            lastOperationOrigin: string | null;
            dispatchOperation(op: unknown, origin?: string): { ok: boolean };
        };
    };
}
