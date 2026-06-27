/**
 * PandaCSS configuration for the "drafting table" visual system: the single source
 * of the raw color palette (every hex literal lives here once), the IBM Plex font
 * tokens, a compact type scale, and the semantic token layer that the app, the
 * split-pane recipes, and the DHTMLX/AG-Grid overrides consume by name. Dark-mode
 * values are reserved on the core surfaces but not yet wired to a theme toggle.
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
                    borderHairline: { value: { _dark: "#2A3036", base: "{colors.grid}" } },
                    canvas: { value: { _dark: "#0E1114", base: "{colors.paper}" } },
                    controlBorder: { value: "rgba(255, 255, 255, 0.45)" },
                    controlHover: { value: "rgba(255, 255, 255, 0.12)" },
                    ink: { value: { _dark: "#EDEFF1", base: "{colors.graphite}" } },
                    inkMuted: { value: { _dark: "#9AA4AF", base: "{colors.slate}" } },
                    inkOnPrimary: { value: { _dark: "#0E1114", base: "{colors.panel}" } },
                    primary: { value: { _dark: "#4E7CB0", base: "{colors.steel}" } },
                    primaryHover: { value: { _dark: "#3D6695", base: "{colors.steelHover}" } },
                    progressOverlay: { value: "rgba(0, 0, 0, 0.12)" },
                    progressOverlayCritical: { value: "rgba(0, 0, 0, 0.18)" },
                    scrimOnPrimary: { value: "rgba(0, 0, 0, 0.18)" },
                    selectionBg: { value: { _dark: "#1C3A57", base: "{colors.steelTint}" } },
                    surface: { value: { _dark: "#171B1F", base: "{colors.panel}" } },
                },
            },
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
                sizes: {
                    splitter: { value: "9px" },
                    toolbar: { value: "52px" },
                },
            },
        },
    },
});
