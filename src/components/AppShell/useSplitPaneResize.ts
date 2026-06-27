/**
 * Drives the draggable divider between the table and Gantt panes. Tracks the table
 * pane's width as a percentage, updates it from pointer drags against the measured
 * container and from arrow-key presses on the focused separator, and clamps the
 * value so neither pane collapses. Returns the current width plus the props to
 * spread onto the separator element and the container ref used to measure drags.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, RefObject } from "react";

const DEFAULT_TABLE_PERCENT = 44;
const KEY_STEP_PERCENT = 2;
const MAX_TABLE_PERCENT = 78;
const MIN_TABLE_PERCENT = 24;

interface SeparatorProps {
    "aria-label": string;
    "aria-orientation": "vertical";
    "aria-valuemax": number;
    "aria-valuemin": number;
    "aria-valuenow": number;
    role: "separator";
    tabIndex: 0;
    onKeyDown(event: KeyboardEvent<HTMLDivElement>): void;
    onPointerDown(event: PointerEvent<HTMLDivElement>): void;
}

interface SplitPaneResize {
    containerRef: RefObject<HTMLDivElement | null>;
    isDragging: boolean;
    separatorProps: SeparatorProps;
    tablePercent: number;
}

export function useSplitPaneResize(): SplitPaneResize {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [tablePercent, setTablePercent] = useState(DEFAULT_TABLE_PERCENT);

    const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    }, []);

    const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            setTablePercent((current) => clampTablePercent(current - KEY_STEP_PERCENT));
        }
        if (event.key === "ArrowRight") {
            event.preventDefault();
            setTablePercent((current) => clampTablePercent(current + KEY_STEP_PERCENT));
        }
    }, []);

    useEffect(() => {
        if (!isDragging) {
            return;
        }

        function handleMove(event: globalThis.PointerEvent): void {
            const container = containerRef.current;
            if (container === null) {
                return;
            }
            const bounds = container.getBoundingClientRect();
            const ratio = (event.clientX - bounds.left) / bounds.width;
            setTablePercent(clampTablePercent(ratio * 100));
        }

        function handleUp(): void {
            setIsDragging(false);
        }

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
        };
    }, [isDragging]);

    return {
        containerRef,
        isDragging,
        separatorProps: {
            "aria-label": "Resize the table and timeline panes",
            "aria-orientation": "vertical",
            "aria-valuemax": MAX_TABLE_PERCENT,
            "aria-valuemin": MIN_TABLE_PERCENT,
            "aria-valuenow": Math.round(tablePercent),
            onKeyDown,
            onPointerDown,
            role: "separator",
            tabIndex: 0,
        },
        tablePercent,
    };
}

function clampTablePercent(value: number): number {
    return Math.min(MAX_TABLE_PERCENT, Math.max(MIN_TABLE_PERCENT, value));
}
