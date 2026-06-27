/**
 * Gantt-only toolbar controls: the Day/Week/Month zoom group wired to the live
 * DHTMLX zoom extension, a Today button that scrolls the timeline to the today
 * marker, and the critical-path legend that teaches the gold chain with text labels,
 * never color alone. Rendered by Toolbar only while the Gantt surface is active,
 * since every control here acts on the DHTMLX widget.
 */
import { gantt } from "dhtmlx-gantt";
import { useState } from "react";
import type { JSX } from "react";

import { css, cx } from "../../../styled-system/css";
import { GANTT_DEFAULT_ZOOM, GANTT_ZOOM_OPTIONS } from "../../constants/ganttZoom";

import { buttonGroupRecipe, controlButtonRecipe } from "./toolbar.recipe";

interface LegendItem {
    glyph: string;
    label: string;
    swatchClass: string;
}

const criticalSwatchClass = css({ color: "gold" });
const floatSwatchClass = css({ color: "float" });
const milestoneSwatchClass = css({ color: "graphite" });

const LEGEND_ITEMS: LegendItem[] = [
    { glyph: "★", label: "Critical", swatchClass: criticalSwatchClass },
    { glyph: "▬", label: "Float", swatchClass: floatSwatchClass },
    { glyph: "◆", label: "Milestone", swatchClass: milestoneSwatchClass },
];

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
    fontSize: "caption",
    lineHeight: "1",
});

export function GanttControls(): JSX.Element {
    const [activeZoom, setActiveZoom] = useState(GANTT_DEFAULT_ZOOM);

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
        <div aria-label="Schedule controls" className={controlsClass} role="toolbar">
            <div aria-label="Timeline zoom" className={buttonGroupRecipe()} role="group">
                {GANTT_ZOOM_OPTIONS.map((option) => (
                    <button
                        aria-pressed={activeZoom === option.level}
                        className={controlButtonRecipe({ active: activeZoom === option.level })}
                        key={option.level}
                        onClick={() => handleZoom(option.level)}
                        type="button"
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            <button
                className={controlButtonRecipe({ active: false })}
                onClick={handleToday}
                type="button"
            >
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
    );
}

function isGanttReady(): boolean {
    return typeof gantt.ext?.zoom?.setLevel === "function" && gantt.getTaskCount() > 0;
}
