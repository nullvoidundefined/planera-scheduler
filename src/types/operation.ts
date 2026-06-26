/**
 * The Operation discriminated union: the change-vector unit the store dispatches,
 * the worker recomputes from, and (in Sub-project 2) the transport broadcasts. The
 * four kind strings are stable contract: resizeActivity, addDependency,
 * removeDependency, toggleCollapse. Type guards narrow each variant.
 */
import type { Dependency } from "./schedule";

export type Operation =
    | { activityId: string; durationDays: number; kind: "resizeActivity" }
    | { edge: Dependency; kind: "addDependency" }
    | { edgeId: string; kind: "removeDependency" }
    | { kind: "toggleCollapse"; rowId: string };

export function isAddDependencyOperation(
    operation: Operation,
): operation is Extract<Operation, { kind: "addDependency" }> {
    return operation.kind === "addDependency";
}

export function isRemoveDependencyOperation(
    operation: Operation,
): operation is Extract<Operation, { kind: "removeDependency" }> {
    return operation.kind === "removeDependency";
}

export function isResizeActivityOperation(
    operation: Operation,
): operation is Extract<Operation, { kind: "resizeActivity" }> {
    return operation.kind === "resizeActivity";
}

export function isToggleCollapseOperation(
    operation: Operation,
): operation is Extract<Operation, { kind: "toggleCollapse" }> {
    return operation.kind === "toggleCollapse";
}
