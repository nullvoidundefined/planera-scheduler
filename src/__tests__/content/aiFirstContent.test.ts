import { describe, expect, test } from "vitest";

import { AI_FIRST_SECTION } from "../../content/aiFirstContent";

describe("AI-first section", () => {
    test("is the 'How I built this' section and splits judgment from leverage", () => {
        expect(AI_FIRST_SECTION.id).toBe("aiFirst");
        expect(AI_FIRST_SECTION.heading).toBe("How I built this");
        const corpus = AI_FIRST_SECTION.body.join(" ");
        expect(corpus).toContain("tests");
        expect(corpus.toLowerCase()).toContain("judgment");
    });
});
