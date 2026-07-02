/**
 * Copy for the Summary (landing) route, kept in one typed module so the words can be
 * edited and reviewed without touching layout. Tone: confident but humble, friendly,
 * interest over show-off (see the design spec, section 2).
 */
export const SUMMARY_HEADING = "I built you a Planera demo";

export const SUMMARY_PARAGRAPHS = [
    "I met with some members of your team this week, and I was impressed enough by them and the product that I wanted to do more than send over the usual application, so I built you this.",
    "Planera is one CPM graph shown as three views: a whiteboard, a Gantt, and a table. Edit in one and the others re-derive, because they're all renderers over a single source of truth. I found that genuinely interesting, so I rebuilt two of those views, the Gantt and the table, on what looks like your actual stack (React, TypeScript, DHTMLX Gantt, AG-Grid, PandaCSS, Vitest) to check whether I actually understand how the pieces fit together.",
    "I left the whiteboard out on purpose. It looks like a custom D3/SVG build with its own design problems. This demo is also single-user; real-time collaboration with WebSockets is the obvious next step, not something I've built.",
    "That's the whole idea: a way to show I'm interested enough to do the homework, and honest about where the homework stops. You've spent years hardening the real thing; this is a few days on two of its views, and the distance between the two is most of the actual engineering.",
];
