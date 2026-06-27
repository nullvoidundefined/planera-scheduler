/**
 * Demo route: the live CPM editor. Mounts the existing AppShell unchanged beneath a
 * visually-hidden page heading (AppShell supplies the <main> landmark but no <h1>).
 * The DemoCaption affordance is added in Task 3.
 */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import { AppShell } from "../../components/AppShell/AppShell";

const visuallyHiddenClass = css({
    clip: "rect(0 0 0 0)",
    height: "1px",
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: "1px",
});

const demoFrameClass = css({ display: "flex", flex: "1", minHeight: "0" });

export function DemoRoute(): JSX.Element {
    return (
        <>
            <h1 className={visuallyHiddenClass}>Live demo</h1>
            <div className={demoFrameClass}>
                <AppShell />
            </div>
        </>
    );
}
