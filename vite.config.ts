/** Vite build configuration: bundles the React app and serves it on the project dev port. */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const DEV_SERVER_PORT = 3000;

export default defineConfig({
    plugins: [react()],
    server: { port: DEV_SERVER_PORT },
    worker: { format: "es" },
});
