import { describe, expect, test } from "vitest";

import { useScheduleSelection } from "../../state/useScheduleSelection";

describe("useScheduleSelection", () => {
    test("starts with no selection and records a selected id", () => {
        expect(useScheduleSelection.getState().selectedActivityId).toBeNull();
        useScheduleSelection.getState().selectActivity("a3");
        expect(useScheduleSelection.getState().selectedActivityId).toBe("a3");
    });

    test("clears the selection when passed null", () => {
        useScheduleSelection.getState().selectActivity("a3");
        useScheduleSelection.getState().selectActivity(null);
        expect(useScheduleSelection.getState().selectedActivityId).toBeNull();
    });
});
