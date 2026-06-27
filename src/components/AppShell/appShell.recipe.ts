/**
 * PandaCSS recipes for the application shell layout: the full-viewport grid that
 * stacks the toolbar over the body, the view stack that fills the body, and the two
 * absolutely-positioned view layers (the integrated Gantt and the standalone table)
 * that occupy the same area. Only the active layer is visible; the inactive one stays
 * mounted and full-size via visibility:hidden so the expensive DHTMLX widget is never
 * re-initialized on a toggle. Visual values resolve to the drafting-table tokens.
 */
import { cva } from "../../../styled-system/css";

export const appShellRecipe = cva({
    base: {
        bg: "canvas",
        color: "ink",
        display: "grid",
        fontFamily: "sans",
        fontSize: "base",
        gridTemplateRows: "auto 1fr",
        height: "100vh",
        overflow: "hidden",
        width: "100vw",
    },
});

export const viewStackRecipe = cva({
    base: {
        bg: "canvas",
        minHeight: "0",
        overflow: "hidden",
        position: "relative",
    },
});

export const viewLayerRecipe = cva({
    base: {
        bg: "surface",
        inset: "0",
        minHeight: "0",
        minWidth: "0",
        overflow: "hidden",
        position: "absolute",
    },
    variants: {
        active: {
            false: { visibility: "hidden" },
            true: { visibility: "visible" },
        },
    },
});
