/**
 * Shared store for the active schedule surface. The toolbar sub-nav writes the
 * selected view and both the AppShell layer stack and the Gantt-specific toolbar
 * controls read it, so switching between the integrated Gantt and the standalone
 * table flips one piece of state without prop drilling. The expensive DHTMLX
 * widget stays mounted across switches; only its visibility follows this value.
 */
import { create } from "zustand";

import { SCHEDULE_VIEW_GANTT } from "../constants/scheduleView";
import type { ScheduleViewKey } from "../constants/scheduleView";

interface ScheduleViewState {
    activeView: ScheduleViewKey;
    setActiveView(view: ScheduleViewKey): void;
}

export const useScheduleView = create<ScheduleViewState>((set) => ({
    activeView: SCHEDULE_VIEW_GANTT,
    setActiveView(view: ScheduleViewKey): void {
        set({ activeView: view });
    },
}));
