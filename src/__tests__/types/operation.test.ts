import { describe, expect, test } from "vitest";

import {
    isAddDependencyOperation,
    isRemoveDependencyOperation,
    isResizeActivityOperation,
    isToggleCollapseOperation,
} from "../../types/operation";
import type { Operation } from "../../types/operation";
import type { Dependency } from "../../types/schedule";

const EDGE: Dependency = {
    id: "e1",
    lagDays: 0,
    predecessorId: "a1",
    successorId: "a2",
    type: "FS",
};

const RESIZE: Operation = { activityId: "a1", durationDays: 5, kind: "resizeActivity" };
const ADD: Operation = { edge: EDGE, kind: "addDependency" };
const REMOVE: Operation = { edgeId: "e1", kind: "removeDependency" };
const TOGGLE: Operation = { kind: "toggleCollapse", rowId: "a1" };

describe("operation type guards", () => {
    test("isResizeActivityOperation narrows only resizeActivity", () => {
        expect(isResizeActivityOperation(RESIZE)).toBe(true);
        expect(isResizeActivityOperation(ADD)).toBe(false);
        if (isResizeActivityOperation(RESIZE)) {
            expect(RESIZE.durationDays).toBe(5);
        }
    });

    test("isAddDependencyOperation narrows only addDependency", () => {
        expect(isAddDependencyOperation(ADD)).toBe(true);
        expect(isAddDependencyOperation(RESIZE)).toBe(false);
        if (isAddDependencyOperation(ADD)) {
            expect(ADD.edge.id).toBe("e1");
        }
    });

    test("isRemoveDependencyOperation narrows only removeDependency", () => {
        expect(isRemoveDependencyOperation(REMOVE)).toBe(true);
        expect(isRemoveDependencyOperation(TOGGLE)).toBe(false);
    });

    test("isToggleCollapseOperation narrows only toggleCollapse", () => {
        expect(isToggleCollapseOperation(TOGGLE)).toBe(true);
        expect(isToggleCollapseOperation(REMOVE)).toBe(false);
    });
});
