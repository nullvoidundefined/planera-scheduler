/**
 * Resolves the CSS class AG-Grid applies to a schedule row: the pastel phase tint
 * and the critical marker, composed. Only phase group rows are tinted (their phase
 * id sits at path[1]); leaf rows share that path[1] but stay white, so the row type
 * is the discriminator. The critical class is appended independently, so a critical
 * phase row carries both. The phase color map is the shared source of truth across
 * views. Wired into the getRowClass hook in TableView.
 */
import { ACTIVITY_TYPE_GROUP } from "../../constants/activityType";

import type { TableRow } from "./types";

const CRITICAL_ROW_CLASS = "ag-row-critical";
const PHASE_PATH_DEPTH = 1;
const PHASE_ROW_CLASS_PREFIX = "phase-";

export function resolveTableRowClass(
    row: TableRow | undefined,
    phaseColorIndex: Map<string, number>,
): string | undefined {
    if (row === undefined) {
        return undefined;
    }
    const rowClasses = [resolvePhaseRowClass(row, phaseColorIndex)];
    if (row.critical === true) {
        rowClasses.push(CRITICAL_ROW_CLASS);
    }
    const joined = rowClasses.filter(Boolean).join(" ");
    return joined === "" ? undefined : joined;
}

function resolvePhaseRowClass(row: TableRow, phaseColorIndex: Map<string, number>): string {
    if (row.type !== ACTIVITY_TYPE_GROUP) {
        return "";
    }
    const phaseId = row.path[PHASE_PATH_DEPTH];
    const phaseIndex = phaseId === undefined ? undefined : phaseColorIndex.get(phaseId);
    return phaseIndex === undefined ? "" : `${PHASE_ROW_CLASS_PREFIX}${phaseIndex}`;
}
