/**
 * Demo route: the live CPM editor. Mounts the existing AppShell unchanged beneath a
 * visually-hidden page heading, with a dismissible DemoCaption anchored over it.
 */
import type { JSX } from "react";

import { css } from "../../styled-system/css";
import { AppShell } from "../components/AppShell/AppShell";
import { DemoCaption } from "../components/DemoCaption/DemoCaption";

const visuallyHiddenClass = css({
    clip: "rect(0 0 0 0)",
    height: "1px",
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: "1px",
});

const demoFrameClass = css({ display: "flex", flex: "1", minHeight: "0", position: "relative" });

export function DemoRoute(): JSX.Element {
    return (
        <>
            <h1 className={visuallyHiddenClass}>Live demo</h1>
            <div className={demoFrameClass}>
                <DemoCaption />
                <AppShell />
            </div>
        </>
    );
}
