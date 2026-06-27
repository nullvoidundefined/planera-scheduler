/** Summary (landing) route: the friendly handshake. Body copy lands in Task 2. */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";

const mainClass = css({
    fontFamily: "sans",
    marginInline: "auto",
    maxWidth: "680px",
    padding: "48px 24px",
});

export function SummaryRoute(): JSX.Element {
    return (
        <main aria-label="Summary" className={mainClass}>
            <h1>I built you a Planera demo</h1>
        </main>
    );
}
