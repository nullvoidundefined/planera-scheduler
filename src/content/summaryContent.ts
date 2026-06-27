/**
 * Copy for the Summary (landing) route, kept in one typed module so the words can be
 * edited and reviewed without touching layout. Tone: confident but humble, friendly,
 * interest over show-off (see the design spec, section 2).
 */
export const SUMMARY_HEADING = "I built you a Planera demo";

export const SUMMARY_PARAGRAPHS = [
    "Hi, I'm Ian. I'm applying for the frontend role at Planera, and instead of a cover letter I built you this.",
    "Planera is one CPM graph shown as three views: a whiteboard, a Gantt, and a table. Edit in one and the others re-derive, because they're all renderers over a single source of truth. I found that genuinely interesting, so I rebuilt two of those views, the Gantt and the table, on what looks like your actual stack (React, TypeScript, DHTMLX Gantt, AG-Grid, PandaCSS, Vitest) to check whether I actually understand how the pieces fit together.",
    "I left the whiteboard out on purpose. It's a custom D3/SVG build with its own design problems, and faking it would have told you nothing true. This demo is also single-user. Real-time collaboration is the genuinely hard part of your system, so I wrote about how I think it works rather than pretending to have built it.",
    "That's the whole idea. Not a flex, just a way to show I'm interested enough to do the homework, and honest about where the homework stops.",
];
