/** Vitest configuration: jsdom environment, globals, setup file, and 60% coverage thresholds. */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    test: {
        coverage: {
            thresholds: { branches: 60, functions: 60, lines: 60, statements: 60 },
        },
        environment: "jsdom",
        environmentOptions: { jsdom: { url: "http://localhost/" } },
        globals: true,
        include: ["src/**/*.test.{ts,tsx}"],
        setupFiles: ["./src/__tests__/setup.ts"],
    },
});
