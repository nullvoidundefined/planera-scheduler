import { describe, expect, test } from "vitest";

import { SUMMARY_HEADING, SUMMARY_PARAGRAPHS } from "../../content/summaryContent";

describe("summary content", () => {
    test("leads with the met-the-team framing", () => {
        expect(SUMMARY_HEADING).toBe("I built you a Planera demo");
        expect(
            SUMMARY_PARAGRAPHS.some((p) => p.includes("met with some members of your team")),
        ).toBe(true);
    });

    test("is honest about scope: whiteboard left out and single-user", () => {
        const joined = SUMMARY_PARAGRAPHS.join(" ");
        expect(joined).toContain("left the whiteboard out");
        expect(joined).toContain("single-user");
    });

    test("names the motive as interest and defers to the mature product", () => {
        const joined = SUMMARY_PARAGRAPHS.join(" ");
        expect(joined).toContain("do the homework");
        expect(joined).toContain("most of the actual engineering");
    });
});
