/**
 * The Architecture write-up's library-based build-system sections (spec 6.1 to 6.7):
 * the author's outside read of how Planera's Gantt and Table are built over one CPM
 * graph. Whiteboard is bracketed out. Every claim about Planera's internals is marked
 * as inference.
 */
import type { ProseSection } from "../types/prose";

export const ARCHITECTURE_SECTIONS: ProseSection[] = [
    {
        body: [
            "From the outside, the cleanest way to explain Planera is that there isn't really a Gantt and a table and a whiteboard. There's one CPM graph, and those three views are just different ways of presenting it. Activities are nodes, dependencies are edges, and each view subscribes to the same source of truth.",
            "Edit a duration in the table and the Gantt bar moves, because they're reading the same data, not syncing three copies. My bet is that this single-model-many-renderers shape is the thing that keeps the product from drowning in three-way sync bugs.",
        ],
        heading: "The bet: one model, three views",
        id: "oneModelThreeViews",
    },
    {
        body: [
            "The detail that makes this a schedule and not a to-do list: most of what you see is computed, not stored. Durations, dependencies, constraints, and calendars are the inputs you save. The dates, the float, and the critical-path flag are outputs the CPM engine derives from the graph.",
            "That's also why the graph has to stay a DAG. A cycle has no valid set of dates. So 'add dependency' isn't just an insert, it's an insert that has to be rejected if it would close a loop.",
        ],
        heading: "Computed versus stored",
        id: "computedVsStored",
    },
    {
        body: [
            "DHTMLX for the Gantt and AG-Grid for the table both look like build-versus-buy calls a small team makes on purpose. A Gantt is a finished, fiddly widget: rows, a time axis, draggable bars, dependency arrows. AG-Grid brings the enterprise grid behaviors the domain actually needs: virtualization, tree-data grouping for WBS, Excel paste, a server-side row model.",
            "You could hand-roll both on something headless like TanStack Table, and you'd trade a license fee for a lot of code to own. On a small team, buying the hard parts and owning the glue is the move. (AG-Grid's enterprise features need a paid license, which is the honest cost of that choice.)",
        ],
        heading: "Why these libraries",
        id: "whyTheseLibraries",
    },
    {
        body: [
            "This is the part I was most curious whether I could get right, because it's the actual day-job skill. DHTMLX and AG-Grid own their own DOM; React doesn't get to reconcile inside them. So you render a stable container once, init the widget in a useEffect with an empty dependency array, and return its destructor for cleanup.",
            "You memo the wrapper and use a latest-ref for callbacks so a parent re-render never reaches the widget. And you feed it data with granular batched updates, addTask and updateTask, never a clearAll and full re-parse, because that flickers. One source of truth: the widget owns live interaction and emits committed changes back up.",
        ],
        heading: "Keeping imperative widgets happy inside React",
        id: "imperativeWidgetInReact",
    },
    {
        body: [
            "You can't put thousands of DOM rows on screen, so the graph gets flattened into an ordered array, and only the visible window renders. The container is the full height (rows times row-height) so the scrollbar tells the truth, and each rendered row is absolutely positioned at its real offset.",
            "Because it's a Gantt, the same trick runs on the time axis: project dates to pixels and only draw the bars in the visible window. SVG memory scales with element count, not how wide the viewBox is, so off-screen bars get removed, not just hidden.",
        ],
        heading: "Rendering thousands of rows",
        id: "virtualizationAtScale",
    },
    {
        body: [
            "When you drag a bar, the on-screen row should move instantly, before any math finishes. So the edit is optimistic and visible-first, and what gets sent is the operation ('extend X by N days'), not the whole plan. The recompute only touches the downstream cone, the successors after the changed activity, not every row.",
            "And it runs in a web worker so the main thread keeps painting at sixty frames a second. One subtlety I'd want to confirm: early dates flow downstream cleanly, but float and the critical path are global properties, so the fully-correct values land a beat later.",
        ],
        heading: "Dragging a bar without freezing",
        id: "interactionAndRecompute",
    },
    {
        body: [
            "My demo is single-user, and I want to be upfront that real-time is the genuinely hard problem here, not the rendering. Here's how I think it has to work, as reasoning rather than experience. Each project is a WebSocket room; the server broadcasts edits to everyone in it. You send granular operations so they can be ordered and merged, and the server is authoritative: entities carry a version, and stale edits get rejected and retried.",
            "The insight I'd lead with is that conflict resolution is two separate problems. One is concurrency: if two people move the same activity, last-write-wins is fine, but only on that one atomic operation, ordered by a server sequence, never on the whole plan. The other is semantic validity: two perfectly valid edits can merge into an invalid schedule. I add Framing to Drywall, you add Drywall to Framing, and now there's a cycle with no valid dates.",
            "So the server has to validate that the merged graph is still a legal DAG and reject what isn't. Convergence isn't the same as correctness.",
        ],
        heading: "The hard part I didn't build: collaboration",
        id: "collaboration",
    },
];
