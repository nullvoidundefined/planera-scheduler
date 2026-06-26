/** Application entry point: mounts AppShell and, in development, starts the MSW worker. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppShell } from "./components/AppShell/AppShell";
import "./index.css";

async function startApp(): Promise<void> {
    if (import.meta.env.DEV) {
        const { worker } = await import("./mocks/browser");
        await worker.start({ onUnhandledRequest: "bypass" });
    }

    const rootElement = document.getElementById("root");
    if (rootElement === null) {
        throw new Error("Root element #root is missing from index.html");
    }

    createRoot(rootElement).render(
        <StrictMode>
            <AppShell />
        </StrictMode>,
    );
}

void startApp();
