/**
 * Vertical drag handle between the table and Gantt panes. Renders a keyboard
 * focusable separator with a precise central grip affordance and a steel highlight
 * while dragging. All interaction wiring (pointer drag, arrow-key resize, ARIA
 * value state) arrives through the separator props from useSplitPaneResize.
 */
import type { JSX } from "react";

import { css, cx } from "../../../styled-system/css";

type SeparatorProps = JSX.IntrinsicElements["div"];

interface SplitterProps {
    isDragging: boolean;
    separatorProps: SeparatorProps;
}

const gripClass = css({
    bg: "borderHairline",
    borderRadius: "1px",
    height: "32px",
    width: "2px",
});

const splitterBaseClass = css({
    _focusVisible: {
        bg: "selectionBg",
        outline: "2px solid token(colors.primary)",
        outlineOffset: "-2px",
    },
    _hover: { bg: "selectionBg" },
    alignItems: "center",
    bg: "canvas",
    cursor: "col-resize",
    display: "flex",
    justifyContent: "center",
    touchAction: "none",
    transition: "background-color 120ms ease",
    width: "splitter",
});

const splitterDraggingClass = css({ bg: "selectionBg" });

export function Splitter({ isDragging, separatorProps }: SplitterProps): JSX.Element {
    return (
        <div
            {...separatorProps}
            className={cx(splitterBaseClass, isDragging ? splitterDraggingClass : undefined)}
        >
            <span aria-hidden="true" className={gripClass} />
        </div>
    );
}
