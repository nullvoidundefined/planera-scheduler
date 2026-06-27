import { describe, expect, test } from "vitest";

import { FAQ_ENTRIES } from "../../content/faqContent";

describe("FAQ content", () => {
    test("answers at least five honest questions", () => {
        expect(FAQ_ENTRIES.length).toBeGreaterThanOrEqual(5);
    });

    test("every entry is a real question with a real answer", () => {
        for (const entry of FAQ_ENTRIES) {
            expect(entry.question.endsWith("?")).toBe(true);
            expect(entry.answer.length).toBeGreaterThan(0);
        }
    });

    test("includes the scope and the AI questions", () => {
        const questions = FAQ_ENTRIES.map((entry) => entry.question).join(" ");
        expect(questions).toContain("whiteboard");
        expect(questions.toLowerCase()).toContain("ai");
    });
});
