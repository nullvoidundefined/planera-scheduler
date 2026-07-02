/**
 * Shared row shapes for the DHTMLX Gantt view: the task rows and link rows the
 * mappers produce and the grid renderers, resolvers, and init hook consume.
 * Extracted from the mapper modules so those stay one-exported-function files.
 */
export interface GanttLink {
    id: string;
    lag: number;
    source: string;
    target: string;
    type: string;
}

export interface GanttTask {
    duration: number;
    id: string;
    isCritical: boolean;
    open: boolean;
    parent: string;
    start_date: Date;
    text: string;
    totalFloat: number;
    type: string;
    wbs: string;
}
