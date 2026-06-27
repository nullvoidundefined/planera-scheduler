/**
 * A small, dismissible note over the demo that tells a first-time reader what to try
 * (drag a bar, edit a cell, scroll the dataset, toggle Gantt/Table). Uses an <aside>
 * landmark and a native button; once dismissed it renders nothing for the session.
 */
import { useState, type JSX } from "react";

import { css } from "../../../styled-system/css";

const HINTS = [
    "Drag a Gantt bar and watch its successors recompute.",
    "Edit a Table cell and watch the Gantt re-derive.",
    "Scroll to feel the virtualization across thousands of activities.",
    "Toggle Gantt and Table: one model, two renderers.",
];

const asideClass = css({
    bg: "surface",
    border: "1px solid token(colors.borderHairline)",
    borderRadius: "6px",
    fontFamily: "sans",
    insetInlineEnd: "16px",
    maxWidth: "320px",
    padding: "12px 14px",
    position: "absolute",
    top: "16px",
    zIndex: "10",
});

const headerRowClass = css({
    alignItems: "center",
    display: "flex",
    gap: "12px",
    justifyContent: "space-between",
});

const titleClass = css({ color: "ink", fontSize: "13px", fontWeight: "600" });

const dismissButtonClass = css({
    _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
    _hover: { color: "ink" },
    background: "none",
    border: "none",
    color: "inkMuted",
    cursor: "pointer",
    fontSize: "12px",
    padding: "2px 4px",
});

const listClass = css({
    color: "inkMuted",
    display: "flex",
    flexDirection: "column",
    fontSize: "12px",
    gap: "4px",
    lineHeight: "1.45",
    margin: "8px 0 0",
    paddingInlineStart: "16px",
});

export function DemoCaption(): JSX.Element | null {
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed) {
        return null;
    }

    return (
        <aside aria-label="How to explore the demo" className={asideClass}>
            <div className={headerRowClass}>
                <span className={titleClass}>What am I looking at?</span>
                <button
                    className={dismissButtonClass}
                    onClick={() => setIsDismissed(true)}
                    type="button"
                >
                    Dismiss
                </button>
            </div>
            <ul className={listClass}>
                {HINTS.map((hint) => (
                    <li key={hint}>{hint}</li>
                ))}
            </ul>
        </aside>
    );
}
