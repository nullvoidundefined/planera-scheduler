/**
 * FAQ for the Architecture route (spec 6.8). Anticipates the questions a skeptical
 * reader would actually ask, and absorbs the "where I'm probably wrong" honesty. No
 * invented flattering questions. The "can I see the code" entry is added once the repo
 * is confirmed public (spec open question 11.3).
 */
import type { FaqEntry } from "../types/prose";

export const FAQ_ENTRIES: FaqEntry[] = [
    {
        answer: "Mostly because the problem is genuinely fun, and a working demo says more than a cover letter. It's meant as a sign of interest, not a flex.",
        question: "Why build this instead of just applying?",
    },
    {
        answer: "Those two are library-based and similar in shape, so they were a fair test of whether I understand your architecture. The whiteboard is a custom D3/SVG build with its own design problems. Faking it would have told you nothing true, so I left it out and said so.",
        question: "Why only the Gantt and table, not the whiteboard?",
    },
    {
        answer: "No, it's single-user. Real-time is the hard part of your system, so I reasoned about it in the write-up instead of pretending to have built it.",
        question: "Is this actually real-time?",
    },
    {
        answer: "A lot of the typing, yes. The architecture, the scope cuts, and the tradeoffs were mine, and the test suite is what kept the loop honest. There's a section above on exactly how that split worked.",
        question: "Did AI write all of this?",
    },
    {
        answer: "A fair amount. The one-model-many-views shape and the CPM basics are well-grounded; the worker boundary, where the server-side row model fits, and whether collaboration is CRDT or server-authoritative are educated guesses. Those are the first things I'd ask about on day one.",
        question: "How much of your read on Planera's architecture is guessing?",
    },
];
