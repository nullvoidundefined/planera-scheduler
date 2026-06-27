import { describe, expect, test } from "vitest";

import { PHASE_PALETTE_SIZE } from "../constants/phasePaletteSize";

// panda.config.ts is the single source of the raw palette; read it as text and
// assert the rebrand's token contract holds (every phase tone present, the gold and
// indigo tokens present, the retired red critical and steel tokens gone). This locks
// the names the index.css overrides and recipes reference by var.
const pandaConfig = Object.values(
    import.meta.glob("../../panda.config.ts", { query: "?raw", import: "default", eager: true }),
)[0] as string;

const PHASE_TONES = ["Bar", "Border", "Surface"];

const PRESENT_TOKENS = ["gold:", "indigo:", "indigoStrong:", "indigoStrongHover:", "indigoTint:"];

const RETIRED_TOKENS = ["critical:", "steel:", "steelHover:", "steelTint:"];

describe("token contract", () => {
    test("defines all 8 phase hues across the three tones", () => {
        for (let phase = 1; phase <= PHASE_PALETTE_SIZE; phase++) {
            for (const tone of PHASE_TONES) {
                expect(pandaConfig).toContain(`phase${phase}${tone}:`);
            }
        }
    });

    test("defines the gold critical and indigo primary tokens", () => {
        for (const token of PRESENT_TOKENS) {
            expect(pandaConfig).toContain(token);
        }
    });

    test("retires the red critical and steel tokens", () => {
        for (const token of RETIRED_TOKENS) {
            expect(pandaConfig).not.toContain(token);
        }
    });

    test("defines radii and shadow scales for the rounded, lifted chrome", () => {
        expect(pandaConfig).toContain("radii:");
        expect(pandaConfig).toContain("shadows:");
    });
});
