/**
 * PandaCSS configuration for the friendly-pastel visual system: the single source
 * of the raw color palette (every hex literal lives here once) - the 8-hue pastel
 * phase ramp, the gold critical accent, the indigo primary, plus radii and shadow
 * scales - alongside the IBM Plex font tokens, a compact type scale, and the
 * semantic token layer that the app, the split-pane recipes, and the DHTMLX/AG-Grid
 * overrides consume by name. Dark-mode values are reserved on the core surfaces but
 * not yet wired to a theme toggle.
 */
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
    exclude: [],
    include: ["./src/**/*.{ts,tsx}"],
    jsxFramework: "react",
    outdir: "styled-system",
    preflight: true,
    theme: {
        extend: {
            semanticTokens: {
                colors: {
                    accent: { value: { _dark: "#8C90F2", base: "{colors.indigo}" } },
                    borderHairline: { value: { _dark: "#2A3036", base: "{colors.grid}" } },
                    canvas: { value: { _dark: "#0E1114", base: "{colors.paper}" } },
                    controlBorder: { value: "rgba(255, 255, 255, 0.45)" },
                    controlHover: { value: "rgba(255, 255, 255, 0.12)" },
                    focusRing: { value: { _dark: "#8C90F2", base: "{colors.indigo}" } },
                    ink: { value: { _dark: "#EDEFF1", base: "{colors.graphite}" } },
                    inkMuted: { value: { _dark: "#9AA4AF", base: "{colors.slate}" } },
                    inkOnPrimary: { value: { _dark: "#0E1114", base: "{colors.panel}" } },
                    primary: { value: { _dark: "#8C90F2", base: "{colors.indigoStrong}" } },
                    primaryHover: {
                        value: { _dark: "#7378EE", base: "{colors.indigoStrongHover}" },
                    },
                    progressOverlay: { value: "rgba(0, 0, 0, 0.12)" },
                    progressOverlayCritical: { value: "rgba(0, 0, 0, 0.18)" },
                    scrimOnPrimary: { value: "rgba(0, 0, 0, 0.18)" },
                    selectionBg: { value: { _dark: "#2A2C66", base: "{colors.indigoTint}" } },
                    surface: { value: { _dark: "#171B1F", base: "{colors.panel}" } },
                },
            },
            tokens: {
                colors: {
                    float: { value: "#97A1AD" },
                    gold: { value: "#9A6F12" },
                    graphite: { value: "#191D21" },
                    grid: { value: "#EBE8E3" },
                    hiviz: { value: "#F0A019" },
                    indigo: { value: "#6366E0" },
                    indigoStrong: { value: "#4F46C7" },
                    indigoStrongHover: { value: "#4338CA" },
                    indigoTint: { value: "#EEF0FD" },
                    panel: { value: "#FFFFFF" },
                    paper: { value: "#F6F4F0" },
                    phase1Bar: { value: "#EEAAB4" },
                    phase1Border: { value: "#C94055" },
                    phase1Surface: { value: "#F9ECEE" },
                    phase2Bar: { value: "#EEC3AA" },
                    phase2Border: { value: "#C97240" },
                    phase2Surface: { value: "#F9F0EC" },
                    phase3Bar: { value: "#EEDBAA" },
                    phase3Border: { value: "#C9A240" },
                    phase3Surface: { value: "#F9F5EC" },
                    phase4Bar: { value: "#B6EEAA" },
                    phase4Border: { value: "#57C940" },
                    phase4Surface: { value: "#EEF9EC" },
                    phase5Bar: { value: "#AAEED5" },
                    phase5Border: { value: "#40C997" },
                    phase5Surface: { value: "#ECF9F4" },
                    phase6Bar: { value: "#AAE6EE" },
                    phase6Border: { value: "#40B9C9" },
                    phase6Surface: { value: "#ECF7F9" },
                    phase7Bar: { value: "#AACBEE" },
                    phase7Border: { value: "#4082C9" },
                    phase7Surface: { value: "#ECF2F9" },
                    phase8Bar: { value: "#D5AAEE" },
                    phase8Border: { value: "#9740C9" },
                    phase8Surface: { value: "#F4ECF9" },
                    slate: { value: "#56606B" },
                },
                fontSizes: {
                    base: { value: "13px" },
                    caption: { value: "11px" },
                    small: { value: "12px" },
                    title: { value: "15px" },
                },
                fonts: {
                    mono: {
                        value: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
                    },
                    sans: {
                        value: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
                    },
                },
                radii: {
                    lg: { value: "12px" },
                    md: { value: "8px" },
                    pill: { value: "999px" },
                    sm: { value: "4px" },
                    xl: { value: "16px" },
                },
                shadows: {
                    lg: { value: "0 8px 24px rgba(16, 24, 40, 0.10)" },
                    md: { value: "0 2px 8px rgba(16, 24, 40, 0.08)" },
                    sm: { value: "0 1px 2px rgba(16, 24, 40, 0.06)" },
                },
                sizes: {
                    splitter: { value: "9px" },
                    toolbar: { value: "52px" },
                },
            },
        },
    },
});
