/** PandaCSS configuration: include globs, base preset, and the styled-system output directory. */
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
    preflight: true,
    include: ["./src/**/*.{ts,tsx}"],
    exclude: [],
    outdir: "styled-system",
    jsxFramework: "react",
    theme: { extend: {} },
});
