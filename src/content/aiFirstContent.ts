/**
 * The AI-first build section (spec section 7). Planera's job description puts AI-first
 * methodology first, so this explains honestly how the work was made: leverage from an
 * agentic loop, judgment from the author, tests as the guardrail. Same humble register
 * as the rest of the write-up.
 */
import type { ProseSection } from "../types/prose";

export const AI_FIRST_SECTION: ProseSection = {
    body: [
        "Planera's job description puts AI-first methodology at the top, so it's fair to ask how this was actually made. The honest version: I worked spec first, then a written plan, then execution, with an agentic coding loop doing a lot of the mechanical typing.",
        "What made that safe wasn't the AI, it was the tests. Every behavior got a failing test before the implementation existed, so the loop could move fast without quietly breaking a schedule invariant. The AI wrote implementations, scaffolded tests, and did refactors. I made the calls that matter: the data model, what to build and what to leave out, the library tradeoffs, where to stop.",
        "That's the pairing I'd bring: judgment plus leverage, with a test suite as the guardrail that makes the leverage trustworthy. It's also why I treat testing as non-negotiable rather than a nice-to-have. The two go together.",
    ],
    heading: "How I built this",
    id: "aiFirst",
};
