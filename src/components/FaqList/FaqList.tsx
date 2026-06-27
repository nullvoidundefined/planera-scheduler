/**
 * Renders the FAQ as native <details>/<summary> disclosures: keyboard-operable and
 * collapsible with no JavaScript, which keeps the accessibility cost at zero. Each
 * question is a <summary>; its answer is the disclosed paragraph.
 */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import type { FaqEntry } from "../../types/prose";

interface FaqListProps {
    entries: FaqEntry[];
}

const listClass = css({ display: "flex", flexDirection: "column", gap: "8px" });

const itemClass = css({
    borderBottom: "1px solid token(colors.borderHairline)",
    paddingBottom: "8px",
});

const summaryClass = css({
    _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
    color: "ink",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    paddingBlock: "6px",
});

const answerClass = css({
    color: "inkMuted",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "6px 0 0",
});

export function FaqList({ entries }: FaqListProps): JSX.Element {
    return (
        <div className={listClass}>
            {entries.map((entry) => (
                <details className={itemClass} key={entry.question}>
                    <summary className={summaryClass}>{entry.question}</summary>
                    <p className={answerClass}>{entry.answer}</p>
                </details>
            ))}
        </div>
    );
}
