import { describe, expect, test } from "vitest";

// The token charter: every color hex lives once in panda.config.ts, and the widget
// overrides, recipes, and components reference tokens only (var(--colors-...) or
// recipe token names). This guard fails if a raw hex color literal leaks into any of
// those styled surfaces, which would drift a value out of the single source of truth.
const HEX_COLOR_PATTERN = /#[0-9a-fA-F]{3,8}\b/;

const STYLED_SOURCES: Record<string, string> = {
    ...import.meta.glob("../../index.css", { query: "?raw", import: "default", eager: true }),
    ...import.meta.glob("../../**/*.recipe.ts", { query: "?raw", import: "default", eager: true }),
    ...import.meta.glob("../../components/**/*.tsx", {
        query: "?raw",
        import: "default",
        eager: true,
    }),
};

describe("no raw hex literals outside panda.config.ts", () => {
    test("finds styled sources to scan", () => {
        expect(Object.keys(STYLED_SOURCES).length).toBeGreaterThan(0);
    });

    test.each(Object.entries(STYLED_SOURCES))(
        "%s references tokens, not raw hex",
        (_path, source) => {
            const match = (source as string).match(HEX_COLOR_PATTERN);
            expect(match, match ? `raw hex ${match[0]} found` : undefined).toBeNull();
        },
    );
});
