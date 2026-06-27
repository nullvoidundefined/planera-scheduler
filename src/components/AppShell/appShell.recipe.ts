/**
 * PandaCSS recipes for the application shell layout: the full-viewport grid that
 * stacks the toolbar over the body, the split-body grid that hosts the table and
 * Gantt panes, and the pane wrapper itself. Visual values resolve to the drafting
 * table semantic tokens defined in panda.config.ts.
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

export const splitBodyRecipe = cva({
    base: {
        bg: "canvas",
        display: "grid",
        gap: "0",
        minHeight: "0",
        overflow: "hidden",
    },
});

export const paneRecipe = cva({
    base: {
        bg: "surface",
        minHeight: "0",
        minWidth: "0",
        overflow: "hidden",
        position: "relative",
    },
    variants: {
        side: {
            left: { borderRight: "1px solid token(colors.borderHairline)" },
            right: { borderLeft: "1px solid token(colors.borderHairline)" },
        },
    },
});
