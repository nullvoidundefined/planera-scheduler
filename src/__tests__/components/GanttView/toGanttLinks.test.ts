import { describe, expect, test } from "vitest";

import { toGanttLinks } from "../../../components/GanttView/toGanttLinks";
import type { Dependency } from "../../../types/schedule";

const DEPENDENCIES: Dependency[] = [
    { id: "e1", lagDays: 2, predecessorId: "a", successorId: "b", type: "FS" },
    { id: "e2", lagDays: 0, predecessorId: "b", successorId: "c", type: "SS" },
];

describe("toGanttLinks", () => {
    test("maps each dependency to a DHTMLX link with the mapped type code", () => {
        const links = toGanttLinks(DEPENDENCIES);
        expect(links[0]).toEqual({ id: "e1", lag: 2, source: "a", target: "b", type: "0" });
        expect(links[1].type).toBe("1");
    });
});
