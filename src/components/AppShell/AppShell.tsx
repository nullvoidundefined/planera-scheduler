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
import { useScheduleView } from "../../state/useScheduleView";
import { GanttView } from "../GanttView/GanttView";
import { TableView } from "../TableView/TableView";

import { Toolbar } from "./Toolbar";
import { appShellRecipe, viewLayerRecipe, viewStackRecipe } from "./appShell.recipe";

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
    const { isError, isPending, refetch } = useScheduleQuery();
    const activeView = useScheduleView((state) => state.activeView);

    const isGanttActive = activeView === SCHEDULE_VIEW_GANTT;
    const isTableActive = activeView === SCHEDULE_VIEW_TABLE;

    return (
        <div className={appShellRecipe()}>
            <Toolbar />
            <main aria-label="Planera schedule editor" className={bodyClass}>
                {isPending ? (
                    <p className={messageBlockClass} role="status">
                        Loading schedule
                    </p>
                ) : null}
                {isError ? (
                    <div className={messageBlockClass} role="alert">
                        <p>Could not load the schedule.</p>
                        <button className={retryButtonClass} onClick={refetch} type="button">
                            Retry
                        </button>
                    </div>
                ) : null}
                {!isPending && !isError ? (
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
                ) : null}
            </main>
        </div>
    );
}
