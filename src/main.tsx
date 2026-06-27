/**
 * Application entry point: starts the MSW worker that serves the generated schedule and mounts
 * AppShell. This is a backend-less demo, so MSW runs in production too (the service worker
 * intercepts the schedule fetch). The store handle is exposed on window only in development, for
 * the E2E suite.
 */
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppShell } from "./components/AppShell/AppShell";
import "./index.css";

async function startApp(): Promise<void> {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass", quiet: import.meta.env.PROD });

    if (import.meta.env.DEV) {
        const { useScheduleStore } = await import("./state/scheduleStore");
        (window as unknown as { __scheduleStore: typeof useScheduleStore }).__scheduleStore =
            useScheduleStore;
    }

    const rootElement = document.getElementById("root");
    if (rootElement === null) {
        throw new Error("Root element #root is missing from index.html");
    }

    const queryClient = new QueryClient();

    createRoot(rootElement).render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <AppShell />
            </QueryClientProvider>
        </StrictMode>,
    );
}

void startApp();
