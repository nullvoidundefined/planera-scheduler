/**
 * Top-level application shell. Drives the initial schedule load through
 * useScheduleQuery and renders pending and error states with retry. The
 * split-pane Table/Gantt body is filled in Task 14.
 */
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

import type { JSX } from "react";

import { GanttView } from "../GanttView/GanttView";
import { TableView } from "../TableView/TableView";
import { useScheduleQuery } from "../../api/useScheduleQuery";

export function AppShell(): JSX.Element {
    const { isError, isPending, refetch } = useScheduleQuery();

    return (
        <main aria-label="Planera schedule editor">
            <h1>Planera Scheduler</h1>
            {isPending ? <p role="status">Loading schedule</p> : null}
            {isError ? (
                <div role="alert">
                    <p>Could not load the schedule.</p>
                    <button type="button" onClick={refetch}>
                        Retry
                    </button>
                </div>
            ) : null}
            {!isPending && !isError ? (
                <div style={{ display: "flex", height: "80vh" }}>
                    <div style={{ flex: 1 }}>
                        <TableView />
                    </div>
                    <div style={{ flex: 1 }}>
                        <GanttView />
                    </div>
                </div>
            ) : null}
        </main>
    );
}
