/**
 * Shared site chrome: a keyboard skip link, the persistent top nav, and the routed
 * outlet wrapped in a focusable #main-content region. Renders no <main> of its own
 * because each route (and the Demo route's AppShell) owns its own <main> landmark.
 */
import type { JSX } from "react";
import { Outlet } from "react-router-dom";

import { css } from "../../../styled-system/css";
import { SiteNav } from "../SiteNav/SiteNav";

const shellClass = css({
    bg: "canvas",
    color: "ink",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: "0",
});

const contentClass = css({
    display: "flex",
    flex: "1",
    flexDirection: "column",
    minHeight: "0",
    overflow: "auto",
});

const headerClass = css({ borderBottom: "1px solid token(colors.borderHairline)" });

const skipLinkClass = css({
    _focus: {
        bg: "primary",
        color: "inkOnPrimary",
        clip: "auto",
        height: "auto",
        left: "8px",
        padding: "8px 12px",
        top: "8px",
        width: "auto",
    },
    clip: "rect(0 0 0 0)",
    fontFamily: "sans",
    height: "1px",
    overflow: "hidden",
    position: "absolute",
    width: "1px",
});

export function SiteShell(): JSX.Element {
    return (
        <div className={shellClass}>
            <a className={skipLinkClass} href="#main-content">
                Skip to content
            </a>
            <header className={headerClass}>
                <SiteNav />
            </header>
            <div className={contentClass} id="main-content" tabIndex={-1}>
                <Outlet />
            </div>
        </div>
    );
}
