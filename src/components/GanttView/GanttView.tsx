/**
 * DHTMLX Gantt view: renders a single stable container that the lifecycle hook
 * owns. Wrapped in React.memo so parent re-renders never reach into the widget's
 * DOM.
 */
import { memo, useRef } from "react";
import type { JSX } from "react";

import { useGanttInit } from "./useGanttInit";

function GanttViewComponent(): JSX.Element {
    const containerRef = useRef<HTMLDivElement | null>(null);
    useGanttInit(containerRef);

    return (
        <section aria-label="Gantt timeline" style={{ height: "100%", width: "100%" }}>
            <div
                ref={containerRef}
                data-testid="gantt-container"
                style={{ height: "100%", width: "100%" }}
            />
        </section>
    );
}

export const GanttView = memo(GanttViewComponent);
