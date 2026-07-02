/**
 * Shared row shape for the AG-Grid table view, consumed by the row mapper, the
 * grid component, and the row-class resolver. Extracted from the mapper module so
 * it stays a one-exported-function file.
 */
import type { ActivityType } from "../../types/schedule";

export interface TableRow {
    critical: boolean;
    duration: number;
    earlyFinish: number;
    earlyStart: number;
    id: string;
    name: string;
    path: string[];
    totalFloat: number;
    type: ActivityType;
    wbs: string;
}
