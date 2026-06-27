import { describe, expect, test } from "vitest";

import { SUMMARY_HEADING, SUMMARY_PARAGRAPHS } from "../../content/summaryContent";

describe("summary content", () => {
    test("leads with the cover-letter framing", () => {
        expect(SUMMARY_HEADING).toBe("I built you a Planera demo");
        expect(SUMMARY_PARAGRAPHS.some((p) => p.includes("instead of a cover letter"))).toBe(true);
    });

    test("is honest about scope: whiteboard left out and single-user", () => {
        const joined = SUMMARY_PARAGRAPHS.join(" ");
        expect(joined).toContain("left the whiteboard out");
        expect(joined).toContain("single-user");
    });

    test("names the motive as interest, not a flex", () => {
        expect(SUMMARY_PARAGRAPHS.some((p) => p.includes("Not a flex"))).toBe(true);
    });
});
