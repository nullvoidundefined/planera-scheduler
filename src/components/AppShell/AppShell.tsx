/**
 * Top-level application shell. Drives the initial schedule load through
 * useScheduleQuery and renders pending and error states with retry beneath the
 * always-present toolbar. On success it lays out the AG-Grid table and the DHTMLX
 * Gantt side by side in a split pane separated by a keyboard-operable draggable
 * divider, with the table pane width owned by useSplitPaneResize.
 */
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import { useScheduleQuery } from "../../api/useScheduleQuery";
import { GanttView } from "../GanttView/GanttView";
import { TableView } from "../TableView/TableView";

import { Splitter } from "./Splitter";
import { Toolbar } from "./Toolbar";
import { appShellRecipe, paneRecipe, splitBodyRecipe } from "./appShell.recipe";
import { useSplitPaneResize } from "./useSplitPaneResize";

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
    const { containerRef, isDragging, separatorProps, tablePercent } = useSplitPaneResize();

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
                    <div
                        className={splitBodyRecipe()}
                        ref={containerRef}
                        style={{ gridTemplateColumns: `${tablePercent}% auto 1fr` }}
                    >
                        <div className={paneRecipe({ side: "left" })}>
                            <TableView />
                        </div>
                        <Splitter isDragging={isDragging} separatorProps={separatorProps} />
                        <div className={paneRecipe({ side: "right" })}>
                            <GanttView />
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}
