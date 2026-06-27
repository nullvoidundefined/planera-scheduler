/**
 * Slim steel toolbar for the schedule editor. The left side carries the project
 * wordmark and the Gantt/Table sub-nav that switches the active surface. The
 * Gantt-only controls (zoom, Today, legend) render on the right through GanttControls
 * only while the Gantt surface is active, since they act on the DHTMLX widget.
 */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import { SCHEDULE_VIEW_GANTT, SCHEDULE_VIEW_OPTIONS } from "../../constants/scheduleView";
import type { ScheduleViewKey } from "../../constants/scheduleView";
import { useScheduleView } from "../../state/useScheduleView";

import { GanttControls } from "./GanttControls";
import { buttonGroupRecipe, controlButtonRecipe } from "./toolbar.recipe";

const PROJECT_NAME = "Riverside Tower";

const brandClass = css({ alignItems: "center", display: "flex", gap: "16px" });

const headingClass = css({
    color: "inkOnPrimary",
    fontFamily: "sans",
    fontSize: "title",
    fontWeight: "600",
    letterSpacing: "0.01em",
    margin: "0",
});

const headerClass = css({
    alignItems: "center",
    bg: "primary",
    boxShadow: "inset 0 -1px 0 0 token(colors.scrimOnPrimary)",
    display: "flex",
    gap: "16px",
    height: "toolbar",
    justifyContent: "space-between",
    paddingInline: "16px",
});

const markClass = css({
    alignItems: "center",
    bg: "inkOnPrimary",
    borderRadius: "3px",
    color: "primary",
    display: "flex",
    fontSize: "small",
    height: "22px",
    justifyContent: "center",
    width: "22px",
});

const wordmarkClass = css({ alignItems: "center", display: "flex", gap: "10px" });

export function Toolbar(): JSX.Element {
    const activeView = useScheduleView((state) => state.activeView);
    const setActiveView = useScheduleView((state) => state.setActiveView);

    function handleViewChange(view: ScheduleViewKey): void {
        setActiveView(view);
    }

    return (
        <header className={headerClass}>
            <div className={brandClass}>
                <div className={wordmarkClass}>
                    <span aria-hidden="true" className={markClass}>
                        ◆
                    </span>
                    <h1 className={headingClass}>{PROJECT_NAME}</h1>
                </div>
                <div aria-label="Schedule view" className={buttonGroupRecipe()} role="group">
                    {SCHEDULE_VIEW_OPTIONS.map((option) => (
                        <button
                            aria-pressed={activeView === option.key}
                            className={controlButtonRecipe({ active: activeView === option.key })}
                            key={option.key}
                            onClick={() => handleViewChange(option.key)}
                            type="button"
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
            {activeView === SCHEDULE_VIEW_GANTT ? <GanttControls /> : null}
        </header>
    );
}
