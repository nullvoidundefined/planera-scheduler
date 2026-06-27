/**
 * Top-level application shell. Drives the initial schedule load through
 * useScheduleQuery and renders pending and error states with retry beneath the
 * always-present toolbar. On success it shows one full-width surface at a time: the
 * integrated DHTMLX grid-plus-timeline Gantt or the standalone AG-Grid table, chosen
 * by the toolbar sub-nav. Both stay mounted in a stacked layout; the inactive layer
 * is visibility-hidden and inert so the costly DHTMLX widget survives every toggle.
 */
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import { useScheduleQuery } from "../../api/useScheduleQuery";
import { SCHEDULE_VIEW_GANTT, SCHEDULE_VIEW_TABLE } from "../../constants/scheduleView";
import { useScheduleStore } from "../../state/scheduleStore";
import { useScheduleView } from "../../state/useScheduleView";
import { GanttView } from "../GanttView/GanttView";
import { TableView } from "../TableView/TableView";

import { Toolbar } from "./Toolbar";
import { appShellRecipe, viewLayerRecipe, viewStackRecipe } from "./appShell.recipe";

interface ScheduleBodyProps {
    activeView: string;
    isError: boolean;
    isSeeded: boolean;
    onRetry(): void;
}

const bodyClass = css({ display: "grid", minHeight: "0", overflow: "hidden" });

const messageBlockClass = css({
    alignItems: "center",
    color: "inkMuted",
    display: "flex",
    flexDirection: "column",
    fontFamily: "sans",
    gap: "12px",
    justifyContent: "center",
    padding: "32px",
});

const retryButtonClass = css({
    _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
    _hover: { bg: "primaryHover" },
    bg: "primary",
    border: "none",
    borderRadius: "4px",
    color: "inkOnPrimary",
    cursor: "pointer",
    fontFamily: "sans",
    fontSize: "small",
    fontWeight: "500",
    height: "34px",
    paddingInline: "16px",
});

export function AppShell(): JSX.Element {
    const { isError, refetch } = useScheduleQuery();
    const activeView = useScheduleView((state) => state.activeView);
    // Gate the views on the store being SEEDED, not merely on the query resolving.
    // loadGraph runs in a parent effect, but the Gantt's own mount effect parses on
    // its first render; rendering the views only once the graph has activities makes
    // the Gantt mount with data in hand (production runs effects once, with no
    // StrictMode double-invoke to re-parse after the seed).
    const isSeeded = useScheduleStore((state) => state.graph.activities.length > 0);

    return (
        <div className={appShellRecipe()}>
            <Toolbar />
            <main aria-label="Planera schedule editor" className={bodyClass}>
                <ScheduleBody
                    activeView={activeView}
                    isError={isError}
                    isSeeded={isSeeded}
                    onRetry={refetch}
                />
            </main>
        </div>
    );
}

function ScheduleBody({ activeView, isError, isSeeded, onRetry }: ScheduleBodyProps): JSX.Element {
    if (isError) {
        return (
            <div className={messageBlockClass} role="alert">
                <p>Could not load the schedule.</p>
                <button className={retryButtonClass} onClick={onRetry} type="button">
                    Retry
                </button>
            </div>
        );
    }
    if (!isSeeded) {
        return (
            <p className={messageBlockClass} role="status">
                Loading schedule
            </p>
        );
    }

    const isGanttActive = activeView === SCHEDULE_VIEW_GANTT;
    const isTableActive = activeView === SCHEDULE_VIEW_TABLE;
    return (
        <div className={viewStackRecipe()}>
            <div
                aria-hidden={!isGanttActive}
                className={viewLayerRecipe({ active: isGanttActive })}
                inert={!isGanttActive}
            >
                <GanttView />
            </div>
            <div
                aria-hidden={!isTableActive}
                className={viewLayerRecipe({ active: isTableActive })}
                inert={!isTableActive}
            >
                <TableView />
            </div>
        </div>
    );
}
