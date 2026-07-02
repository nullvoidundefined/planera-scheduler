/**
 * Summary (landing) route: the friendly handshake. Renders the typed summary copy and
 * two calls to action (open the demo, read the write-up). The author byline carries no
 * external link until the source repo is confirmed public (spec open question 11.3).
 */
import type { JSX } from "react";
import { Link } from "react-router-dom";

import { css } from "../../styled-system/css";
import { SUMMARY_HEADING, SUMMARY_PARAGRAPHS } from "../data/summaryContent";

const mainClass = css({
    fontFamily: "sans",
    marginInline: "auto",
    maxWidth: "680px",
    padding: "48px 24px",
});

const headingClass = css({ color: "ink", fontSize: "32px", lineHeight: "1.2", margin: "0 0 24px" });

const paragraphClass = css({
    color: "ink",
    fontSize: "17px",
    lineHeight: "1.6",
    margin: "0 0 16px",
});

const ctaRowClass = css({ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "28px" });

const ctaPrimaryClass = css({
    _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
    _hover: { bg: "primaryHover" },
    bg: "primary",
    borderRadius: "4px",
    color: "inkOnPrimary",
    fontSize: "15px",
    fontWeight: "500",
    padding: "10px 16px",
    textDecoration: "none",
});

const ctaSecondaryClass = css({
    _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
    _hover: { borderColor: "primary", color: "ink" },
    border: "1px solid token(colors.borderHairline)",
    borderRadius: "4px",
    color: "ink",
    fontSize: "15px",
    fontWeight: "500",
    padding: "10px 16px",
    textDecoration: "none",
});

const bylineClass = css({ color: "inkMuted", fontSize: "14px", marginTop: "32px" });

export function SummaryRoute(): JSX.Element {
    return (
        <main aria-label="Summary" className={mainClass}>
            <h1 className={headingClass}>{SUMMARY_HEADING}</h1>
            {SUMMARY_PARAGRAPHS.map((paragraph) => (
                <p className={paragraphClass} key={paragraph.slice(0, 24)}>
                    {paragraph}
                </p>
            ))}
            <div className={ctaRowClass}>
                <Link className={ctaPrimaryClass} to="/demo">
                    Open the demo
                </Link>
                <Link className={ctaSecondaryClass} to="/architecture">
                    Read the write-up
                </Link>
            </div>
            <p className={bylineClass}>Built by Ian Greenough.</p>
        </main>
    );
}
