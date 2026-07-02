import { describe, expect, test } from "vitest";

import { ARCHITECTURE_SECTIONS } from "../../data/architectureSections";

const EXPECTED_IDS = [
    "oneModelThreeViews",
    "computedVsStored",
    "whyTheseLibraries",
    "imperativeWidgetInReact",
    "virtualizationAtScale",
    "interactionAndRecompute",
    "collaboration",
];

const INFERENCE_MARKERS = ["my bet", "from the outside", "I'm guessing", "I think", "I'd want to"];

describe("architecture sections", () => {
    test("covers the seven build-system sections in order", () => {
        expect(ARCHITECTURE_SECTIONS.map((section) => section.id)).toEqual(EXPECTED_IDS);
    });

    test("every section has a heading and non-empty body", () => {
        for (const section of ARCHITECTURE_SECTIONS) {
            expect(section.heading.length).toBeGreaterThan(0);
            expect(section.body.length).toBeGreaterThan(0);
            expect(section.body.every((paragraph) => paragraph.length > 0)).toBe(true);
        }
    });

    test("marks claims about Planera as inference, not fact", () => {
        const corpus = ARCHITECTURE_SECTIONS.flatMap((section) => section.body)
            .join(" ")
            .toLowerCase();
        expect(INFERENCE_MARKERS.some((marker) => corpus.includes(marker.toLowerCase()))).toBe(
            true,
        );
    });
});
