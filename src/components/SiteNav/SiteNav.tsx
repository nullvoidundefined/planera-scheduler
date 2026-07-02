/**
 * Persistent top navigation shared across the three portfolio routes. NavLink sets
 * aria-current="page" on the active route, which drives both the active style and
 * assistive-tech state.
 */
import type { JSX } from "react";
import { NavLink } from "react-router-dom";

import { css } from "../../../styled-system/css";
import { ROUTE_ARCHITECTURE_PATH, ROUTE_DEMO_PATH } from "../../constants/routes";

const navClass = css({
    alignItems: "center",
    display: "flex",
    fontFamily: "sans",
    gap: "20px",
    paddingBlock: "12px",
    paddingInline: "20px",
});

const linkClass = css({
    "&[aria-current=page]": { color: "ink", fontWeight: "600" },
    _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
    _hover: { color: "ink" },
    color: "inkMuted",
    fontSize: "14px",
    textDecoration: "none",
});

export function SiteNav(): JSX.Element {
    return (
        <nav aria-label="Site" className={navClass}>
            <NavLink className={linkClass} end to="/">
                Summary
            </NavLink>
            <NavLink className={linkClass} to={ROUTE_DEMO_PATH}>
                Demo
            </NavLink>
            <NavLink className={linkClass} to={ROUTE_ARCHITECTURE_PATH}>
                Write-up
            </NavLink>
        </nav>
    );
}
