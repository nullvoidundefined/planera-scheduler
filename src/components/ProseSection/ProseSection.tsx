/**
 * Renders one titled prose section: an <h2> heading wired to its <section> via
 * aria-labelledby, followed by the section's paragraphs. Reused for every write-up
 * section and for the AI-first section so the route stays DRY.
 */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import type { ProseSection as ProseSectionData } from "../../types/prose";

interface ProseSectionProps {
    section: ProseSectionData;
}

const sectionClass = css({ margin: "0 0 36px" });

const headingClass = css({ color: "ink", fontSize: "22px", lineHeight: "1.3", margin: "0 0 12px" });

const paragraphClass = css({
    color: "ink",
    fontSize: "17px",
    lineHeight: "1.6",
    margin: "0 0 14px",
});

export function ProseSection({ section }: ProseSectionProps): JSX.Element {
    return (
        <section aria-labelledby={`${section.id}-heading`} className={sectionClass}>
            <h2 className={headingClass} id={`${section.id}-heading`}>
                {section.heading}
            </h2>
            {section.body.map((paragraph) => (
                <p className={paragraphClass} key={paragraph.slice(0, 24)}>
                    {paragraph}
                </p>
            ))}
        </section>
    );
}
