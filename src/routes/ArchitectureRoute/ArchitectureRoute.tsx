/** Architecture write-up route: the assessment. Sections, AI-first, and FAQ land in Tasks 4 to 6. */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";

const mainClass = css({
    fontFamily: "sans",
    marginInline: "auto",
    maxWidth: "720px",
    padding: "48px 24px",
});

export function ArchitectureRoute(): JSX.Element {
    return (
        <main aria-label="Architecture write-up" className={mainClass}>
            <h1>How I think Planera's frontend is built</h1>
        </main>
    );
}
