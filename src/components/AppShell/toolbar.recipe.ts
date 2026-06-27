/**
 * Shared PandaCSS recipes for the toolbar's interactive controls: the indigo pill
 * button (with an active/pressed variant) and the tight horizontal button group.
 * Both the Gantt/Table sub-nav in Toolbar and the zoom controls in GanttControls
 * consume these so the two control clusters stay visually identical. Values resolve
 * to the friendly-pastel tokens.
 */
import { cva } from "../../../styled-system/css";

export const controlButtonRecipe = cva({
    base: {
        _focusVisible: { outline: "2px solid token(colors.inkOnPrimary)", outlineOffset: "2px" },
        _hover: { bg: "controlHover" },
        bg: "transparent",
        border: "1px solid token(colors.controlBorder)",
        borderRadius: "pill",
        color: "inkOnPrimary",
        cursor: "pointer",
        fontFamily: "sans",
        fontSize: "small",
        fontWeight: "500",
        height: "30px",
        paddingInline: "12px",
    },
    variants: {
        active: {
            false: {},
            true: { bg: "inkOnPrimary", borderColor: "transparent", color: "primary" },
        },
    },
});

export const buttonGroupRecipe = cva({
    base: { alignItems: "center", display: "flex", gap: "4px" },
});
