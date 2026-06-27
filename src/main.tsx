/** Application entry point: mounts AppShell and, in development, starts the MSW worker. */
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
    if (import.meta.env.DEV) {
        const { worker } = await import("./mocks/browser");
        await worker.start({ onUnhandledRequest: "bypass" });

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
