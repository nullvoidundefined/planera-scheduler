/**
 * Injects a drag handle at the right edge of the DHTMLX Gantt grid so the user
 * can widen or narrow the grid column versus the timeline. The DHTMLX GPL build
 * registers the layout resizer view with a null create function (it is a PRO-only
 * feature), so no grab target is rendered. This module provides an equivalent
 * absolutely-positioned overlay div. Dragging calls gantt.render() with the updated
 * gantt.config.grid_width so the layout reflows to the new split point.
 */
import { gantt } from "dhtmlx-gantt";

const GANTT_GRID_RESIZE_HANDLE_CLASS = "gantt-grid-resize-handle";
const GRID_WIDTH_MAX_PX = 1400;
const GRID_WIDTH_MIN_PX = 320;
const HANDLE_HALF_WIDTH_PX = 4;

export function attachGridResizer(container: HTMLDivElement): () => void {
    const gridCell = container.querySelector<HTMLElement>(".grid_cell");
    if (gridCell === null) {
        return () => {};
    }

    const handle = buildHandle(container);
    updateHandlePosition(handle, gridCell, container);

    // Shared drag state; must be declared before the arrow-function handlers that close
    // over them (arrow closures are not hoisted, so data-dependency order applies).
    let latestMouseX = 0;
    let pendingAnimationFrame: number | null = null;
    let startGridWidth = 0;
    let startMouseX = 0;

    // Arrow functions so TypeScript propagates the const-narrowed gridCell type into
    // the closure body (function declarations are treated as hoisted and lose narrowing).
    const onMouseMove = (event: MouseEvent): void => {
        latestMouseX = event.clientX;
        if (pendingAnimationFrame !== null) {
            return;
        }
        pendingAnimationFrame = requestAnimationFrame(() => {
            pendingAnimationFrame = null;
            const newGridWidth = clampGridWidth(startGridWidth + latestMouseX - startMouseX);
            gantt.config.grid_width = newGridWidth;
            gantt.render();
            updateHandlePosition(handle, gridCell, container);
        });
    };

    const onMouseUp = (): void => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        if (pendingAnimationFrame !== null) {
            cancelAnimationFrame(pendingAnimationFrame);
            pendingAnimationFrame = null;
        }
    };

    const onMouseDown = (event: MouseEvent): void => {
        event.preventDefault();
        latestMouseX = event.clientX;
        startGridWidth = gantt.config.grid_width;
        startMouseX = event.clientX;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    handle.addEventListener("mousedown", onMouseDown);

    return () => {
        handle.removeEventListener("mousedown", onMouseDown);
        handle.remove();
    };
}

function buildHandle(container: HTMLDivElement): HTMLDivElement {
    const handle = document.createElement("div");
    handle.className = GANTT_GRID_RESIZE_HANDLE_CLASS;
    container.appendChild(handle);
    return handle;
}

function clampGridWidth(width: number): number {
    return Math.min(Math.max(width, GRID_WIDTH_MIN_PX), GRID_WIDTH_MAX_PX);
}

function updateHandlePosition(
    handle: HTMLDivElement,
    gridCell: HTMLElement,
    container: HTMLDivElement,
): void {
    const containerRect = container.getBoundingClientRect();
    const gridRect = gridCell.getBoundingClientRect();
    handle.style.left = `${gridRect.right - containerRect.left - HANDLE_HALF_WIDTH_PX}px`;
    handle.style.top = `${gridRect.top - containerRect.top}px`;
    handle.style.height = `${gridRect.height}px`;
}
