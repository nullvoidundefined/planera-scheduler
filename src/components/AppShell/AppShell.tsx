/**
 * Top-level application shell. For Task 1 it renders a labelled empty frame so
 * the app mounts and the smoke test has a stable root; later tasks fill it with
 * the toolbar and the split-pane Table/Gantt layout.
 */
import type { JSX } from "react";

export function AppShell(): JSX.Element {
    return (
        <main aria-label="Planera schedule editor">
            <h1>Planera Scheduler</h1>
        </main>
    );
}
