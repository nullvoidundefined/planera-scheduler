/**
 * Origin markers identifying which view emitted an operation. The store records
 * the origin of the last operation and each view checks it so a store update it
 * caused does not echo back as a spurious re-dispatched operation.
 */
import type { OperationOrigin } from "../types/operation";

export const OPERATION_ORIGIN_GANTT: OperationOrigin = "gantt";
export const OPERATION_ORIGIN_TABLE: OperationOrigin = "table";
