/**
 * Slim steel toolbar for the schedule editor. The left side carries the project
 * wordmark and the single page heading; the right side groups the Day/Week/Month
 * zoom control (wired to the live DHTMLX zoom extension), a Today button that
 * scrolls the timeline to the today marker, and a critical-path legend that teaches
 * the red-chain signature with text labels, never color alone.
 */
import { gantt } from "dhtmlx-gantt";
import { useState } from "react";
import type { JSX } from "react";

import { css, cx } from "../../../styled-system/css";
import { GANTT_ZOOM_DAY, GANTT_ZOOM_OPTIONS } from "../../constants/ganttZoom";

interface LegendItem {
    glyph: string;
    label: string;
    swatchClass: string;
}

const PROJECT_NAME = "Riverside Tower";

const criticalSwatchClass = css({ color: "critical" });
const floatSwatchClass = css({ color: "float" });
const milestoneSwatchClass = css({ color: "graphite" });

const LEGEND_ITEMS: LegendItem[] = [
    { glyph: "▬", label: "Critical", swatchClass: criticalSwatchClass },
    { glyph: "▬", label: "Float", swatchClass: floatSwatchClass },
    { glyph: "◆", label: "Milestone", swatchClass: milestoneSwatchClass },
];

const brandClass = css({ alignItems: "center", display: "flex", gap: "10px" });

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
    boxShadow: "inset 0 -1px 0 0 rgba(0, 0, 0, 0.18)",
    display: "flex",
    gap: "16px",
    height: "toolbar",
    justifyContent: "space-between",
    paddingInline: "16px",
});

const controlButtonClass = css({
    _focusVisible: { outline: "2px solid token(colors.inkOnPrimary)", outlineOffset: "2px" },
    _hover: { bg: "rgba(255, 255, 255, 0.12)" },
    bg: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.45)",
    borderRadius: "4px",
    color: "inkOnPrimary",
    cursor: "pointer",
    fontFamily: "sans",
    fontSize: "small",
    fontWeight: "500",
    height: "30px",
    paddingInline: "12px",
});

const controlsClass = css({ alignItems: "center", display: "flex", gap: "16px" });

const legendClass = css({
    alignItems: "center",
    color: "inkOnPrimary",
    display: "flex",
    fontFamily: "sans",
    fontSize: "caption",
    gap: "14px",
    margin: "0",
    paddingLeft: "0",
});

const legendItemClass = css({
    alignItems: "center",
    display: "flex",
    gap: "6px",
    listStyle: "none",
});

const legendSwatchClass = css({
    fontSize: "11px",
    lineHeight: "1",
});

const markClass = css({
    alignItems: "center",
    bg: "inkOnPrimary",
    borderRadius: "3px",
    color: "primary",
    display: "flex",
    fontSize: "12px",
    height: "22px",
    justifyContent: "center",
    width: "22px",
});

const zoomActiveClass = css({ bg: "inkOnPrimary", borderColor: "transparent", color: "primary" });

const zoomGroupClass = css({ alignItems: "center", display: "flex", gap: "4px" });

export function Toolbar(): JSX.Element {
    const [activeZoom, setActiveZoom] = useState(GANTT_ZOOM_DAY);

    function handleToday(): void {
        if (isGanttReady()) {
            gantt.showDate(new Date());
        }
    }

    function handleZoom(level: string): void {
        setActiveZoom(level);
        if (isGanttReady()) {
            gantt.ext.zoom.setLevel(level);
        }
    }

    return (
        <header className={headerClass}>
            <div className={brandClass}>
                <span aria-hidden="true" className={markClass}>
                    ◆
                </span>
                <h1 className={headingClass}>{PROJECT_NAME}</h1>
            </div>
            <div aria-label="Schedule controls" className={controlsClass} role="toolbar">
                <div aria-label="Timeline zoom" className={zoomGroupClass} role="group">
                    {GANTT_ZOOM_OPTIONS.map((option) => (
                        <button
                            aria-pressed={activeZoom === option.level}
                            className={cx(
                                controlButtonClass,
                                activeZoom === option.level ? zoomActiveClass : undefined,
                            )}
                            key={option.level}
                            onClick={() => handleZoom(option.level)}
                            type="button"
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <button className={controlButtonClass} onClick={handleToday} type="button">
                    Today
                </button>
                <ul aria-label="Critical path legend" className={legendClass}>
                    {LEGEND_ITEMS.map((item) => (
                        <li className={legendItemClass} key={item.label}>
                            <span
                                aria-hidden="true"
                                className={cx(legendSwatchClass, item.swatchClass)}
                            >
                                {item.glyph}
                            </span>
                            <span>{item.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </header>
    );
}

function isGanttReady(): boolean {
    return typeof gantt.ext?.zoom?.setLevel === "function" && gantt.getTaskCount() > 0;
}
