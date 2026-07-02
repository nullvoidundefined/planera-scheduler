/**
 * Architecture write-up route: the author's outside read of how Planera's library-based
 * frontend (DHTMLX Gantt + AG-Grid Table over one CPM graph) is built. Maps the typed
 * section content through ProseSection, followed by the AI-first section.
 */
import type { JSX } from "react";

import { css } from "../../styled-system/css";
import { ProseSection } from "../components/ProseSection/ProseSection";
import { AI_FIRST_SECTION } from "../data/aiFirstContent";
import { ARCHITECTURE_SECTIONS } from "../data/architectureSections";

const INTRO =
    "This is my read, from the outside, of how the library-based half of Planera's frontend fits together: the Gantt and the table as two renderers over one CPM graph. Planera is a mature product your team has hardened over years; this is a few-days sketch of two of its views, not a claim to match it. I left the whiteboard out because it looks like a custom build with its own design problem. Where I'm reasoning about your internals rather than stating a fact, I've tried to say so.";

const REPO_URL = "https://github.com/nullvoidundefined/planera-scheduler";

const REPO_LABEL = "github.com/nullvoidundefined/planera-scheduler";

const REPO_HEADING = "The source";

const REPO_LEAD =
    "The demo this write-up accompanies is real, running code. The repo's public if you want to read it:";

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

const repoSectionClass = css({ margin: "0 0 40px" });

const repoHeadingClass = css({
    color: "ink",
    fontSize: "22px",
    lineHeight: "1.3",
    margin: "0 0 12px",
});

const repoLeadClass = css({
    color: "ink",
    fontSize: "17px",
    lineHeight: "1.6",
    margin: "0 0 12px",
});

const repoLinkClass = css({
    _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
    _hover: { textDecoration: "underline" },
    color: "primary",
    fontSize: "17px",
    fontWeight: "500",
    wordBreak: "break-all",
});

export function ArchitectureRoute(): JSX.Element {
    return (
        <main aria-label="Architecture write-up" className={mainClass}>
            <h1 className={headingClass}>My outside read of how Planera's frontend is built</h1>
            <p className={introClass}>{INTRO}</p>
            <section aria-labelledby="repo-heading" className={repoSectionClass}>
                <h2 className={repoHeadingClass} id="repo-heading">
                    {REPO_HEADING}
                </h2>
                <p className={repoLeadClass}>{REPO_LEAD}</p>
                <a
                    className={repoLinkClass}
                    href={REPO_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {REPO_LABEL}
                </a>
            </section>
            {ARCHITECTURE_SECTIONS.map((section) => (
                <ProseSection key={section.id} section={section} />
            ))}
            <ProseSection section={AI_FIRST_SECTION} />
        </main>
    );
}
