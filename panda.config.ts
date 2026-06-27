/**
 * PandaCSS configuration for the "drafting table" visual system: the single source
 * of the raw color palette (every hex literal lives here once), the IBM Plex font
 * tokens, a compact type scale, and the semantic token layer that the app, the
 * split-pane recipes, and the DHTMLX/AG-Grid overrides consume by name. Dark-mode
 * values are reserved on the core surfaces but not yet wired to a theme toggle.
 */
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
    preflight: true,
    include: ["./src/**/*.{ts,tsx}"],
    exclude: [],
    outdir: "styled-system",
    jsxFramework: "react",
    theme: {
        extend: {
            tokens: {
                colors: {
                    critical: { value: "#C5221C" },
                    float: { value: "#97A1AD" },
                    graphite: { value: "#191D21" },
                    grid: { value: "#E4E7EA" },
                    hiviz: { value: "#F0A019" },
                    panel: { value: "#FFFFFF" },
                    paper: { value: "#F4F5F6" },
                    slate: { value: "#56606B" },
                    steel: { value: "#2E5984" },
                    steelHover: { value: "#24486B" },
                    steelTint: { value: "#E7EDF3" },
                },
                fonts: {
                    mono: {
                        value: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
                    },
                    sans: {
                        value: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
                    },
                },
                fontSizes: {
                    base: { value: "13px" },
                    caption: { value: "11px" },
                    small: { value: "12px" },
                    title: { value: "15px" },
                },
                sizes: {
                    splitter: { value: "9px" },
                    toolbar: { value: "52px" },
                },
            },
            semanticTokens: {
                colors: {
                    borderHairline: { value: { base: "{colors.grid}", _dark: "#2A3036" } },
                    canvas: { value: { base: "{colors.paper}", _dark: "#0E1114" } },
                    controlBorder: { value: "rgba(255, 255, 255, 0.45)" },
                    controlHover: { value: "rgba(255, 255, 255, 0.12)" },
                    ink: { value: { base: "{colors.graphite}", _dark: "#EDEFF1" } },
                    inkMuted: { value: { base: "{colors.slate}", _dark: "#9AA4AF" } },
                    inkOnPrimary: { value: { base: "{colors.panel}", _dark: "#0E1114" } },
                    primary: { value: { base: "{colors.steel}", _dark: "#4E7CB0" } },
                    primaryHover: { value: { base: "{colors.steelHover}", _dark: "#3D6695" } },
                    progressOverlay: { value: "rgba(0, 0, 0, 0.12)" },
                    progressOverlayCritical: { value: "rgba(0, 0, 0, 0.18)" },
                    scrimOnPrimary: { value: "rgba(0, 0, 0, 0.18)" },
                    selectionBg: { value: { base: "{colors.steelTint}", _dark: "#1C3A57" } },
                    surface: { value: { base: "{colors.panel}", _dark: "#171B1F" } },
                },
            },
        },
    },
});
