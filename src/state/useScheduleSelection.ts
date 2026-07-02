/**
 * Shared selection store: the currently selected activity id. Selecting a row in
 * the grid highlights its bar in the Gantt and vice versa, so both imperative
 * views read and write this single store.
 */
import { create } from "zustand";

interface SelectionState {
    selectActivity(id: string | null): void;
    selectedActivityId: string | null;
}

export const useScheduleSelection = create<SelectionState>((set) => ({
    selectActivity(id: string | null): void {
        set({ selectedActivityId: id });
    },
    selectedActivityId: null,
}));
