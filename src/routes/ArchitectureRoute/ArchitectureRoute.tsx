/**
 * Architecture write-up route: the author's outside read of how Planera's library-based
 * frontend (DHTMLX Gantt + AG-Grid Table over one CPM graph) is built. Maps the typed
 * section content through ProseSection, followed by the AI-first section.
 */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import { ProseSection } from "../../components/ProseSection/ProseSection";
import { AI_FIRST_SECTION } from "../../content/aiFirstContent";
import { ARCHITECTURE_SECTIONS } from "../../content/architectureSections";

const INTRO =
    "This is my read, from the outside, of how the library-based half of Planera's frontend fits together: the Gantt and the table as two renderers over one CPM graph. I left the whiteboard out because it's a custom build with its own design problem. Where I'm reasoning about your internals rather than stating a fact, I've tried to say so.";

const mainClass = css({
    fontFamily: "sans",
    marginInline: "auto",
    maxWidth: "720px",
    padding: "48px 24px",
});

const headingClass = css({ color: "ink", fontSize: "32px", lineHeight: "1.2", margin: "0 0 16px" });

const introClass = css({
    color: "inkMuted",
    fontSize: "18px",
    lineHeight: "1.6",
    margin: "0 0 40px",
});

export function ArchitectureRoute(): JSX.Element {
    return (
        <main aria-label="Architecture write-up" className={mainClass}>
            <h1 className={headingClass}>How I think Planera's frontend is built</h1>
            <p className={introClass}>{INTRO}</p>
            {ARCHITECTURE_SECTIONS.map((section) => (
                <ProseSection key={section.id} section={section} />
            ))}
            <ProseSection section={AI_FIRST_SECTION} />
        </main>
    );
}
