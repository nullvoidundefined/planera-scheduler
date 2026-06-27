/**
 * AG-Grid Enterprise Tree-Data table view. Renders the schedule hierarchy via
 * getDataPath over the ancestry path, with computed read-only columns and an
 * editable duration that emits a resizeActivity operation. Row selection and
 * group expand/collapse write the shared stores so both views stay aligned.
 */
import type {
    CellValueChangedEvent,
    ColDef,
    GetDataPath,
    GetRowIdParams,
    RowClassParams,
    RowGroupOpenedEvent,
    RowClickedEvent,
    ValueSetterParams,
} from "ag-grid-community";
import { themeQuartz } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import { OPERATION_ORIGIN_TABLE } from "../../constants/operationOrigin";
import { createCalendar } from "../../services/createCalendar";
import { formatScheduleDate } from "../../services/formatScheduleDate";
import { getPhaseColorIndex } from "../../services/getPhaseColorIndex";
import { useScheduleStore } from "../../state/scheduleStore";
import { useScheduleSelection } from "../../state/useScheduleSelection";

import { registerGridModules } from "./registerGridModules";
import { resolveTableRowClass } from "./resolveTableRowClass";
import type { TableRow } from "./toTableRows";
import { toTableRows } from "./toTableRows";

registerGridModules();

const CALENDAR = createCalendar();

const CRITICAL_FIELD = "critical";
const CRITICAL_TAG = "★ CP";
const DURATION_FIELD = "duration";
const EARLY_FINISH_FIELD = "earlyFinish";
const EARLY_START_FIELD = "earlyStart";
const HEADER_HEIGHT_PX = 34;
const NAME_FIELD = "name";
const ROW_HEIGHT_PX = 30;
const TOTAL_FLOAT_FIELD = "totalFloat";
const WBS_FIELD = "wbs";

// IBM Plex Mono on every column that carries schedule data: codes, durations,
// dates, and float. The activity name stays in IBM Plex Sans via the group column.
const MONO_CELL_CLASS = css({ fontFamily: "mono" });

// Friendly-pastel theme over AG-Grid v33's Theming API. Every value resolves to a
// Panda-emitted token CSS variable so the only hex literals stay in panda.config.ts.
// Indigo carries the accent, selection, and hover; the wrapper rounds to soften the
// grid into the rest of the rebranded chrome.
const TABLE_THEME = themeQuartz.withParams({
    accentColor: "var(--colors-indigo)",
    backgroundColor: "var(--colors-panel)",
    borderColor: "var(--colors-grid)",
    cellTextColor: "var(--colors-graphite)",
    chromeBackgroundColor: "var(--colors-paper)",
    fontFamily: "var(--fonts-sans)",
    fontSize: "13px",
    foregroundColor: "var(--colors-graphite)",
    headerBackgroundColor: "var(--colors-indigo-tint)",
    headerFontWeight: 600,
    headerTextColor: "var(--colors-graphite)",
    oddRowBackgroundColor: "var(--colors-panel)",
    rowHoverColor: "var(--colors-indigo-tint)",
    selectedRowBackgroundColor: "var(--colors-indigo-tint)",
    wrapperBorderRadius: "var(--radii-lg)",
});

const AUTO_GROUP_COLUMN_DEF: ColDef<TableRow> = {
    field: NAME_FIELD,
    headerName: "Activity",
    minWidth: 280,
};

const COLUMN_DEFS: ColDef<TableRow>[] = [
    { cellClass: MONO_CELL_CLASS, field: WBS_FIELD, headerName: "WBS", width: 120 },
    {
        cellClass: MONO_CELL_CLASS,
        editable: (params) => params.data?.type !== "group",
        field: DURATION_FIELD,
        headerName: "Duration (d)",
        valueSetter: (params: ValueSetterParams<TableRow>) => {
            const next = Number(params.newValue);
            if (!Number.isFinite(next) || next < 0) {
                return false;
            }
            // AG-Grid compares data[field] before and after calling valueSetter to
            // decide whether to fire onCellValueChanged. Mutate params.data here so
            // AG-Grid detects the change and fires the event. The Zustand store
            // (dispatchOperation in onCellValueChanged) is the authoritative source
            // of truth; this mutation just satisfies AG-Grid's change-detection gate.
            params.data.duration = next;
            return true;
        },
        width: 130,
    },
    {
        cellClass: MONO_CELL_CLASS,
        field: EARLY_START_FIELD,
        headerName: "Start",
        valueFormatter: (params) => formatScheduleDate(Number(params.value), CALENDAR),
        width: 130,
    },
    {
        cellClass: MONO_CELL_CLASS,
        field: EARLY_FINISH_FIELD,
        headerName: "Finish",
        valueFormatter: (params) => formatScheduleDate(Number(params.value), CALENDAR),
        width: 130,
    },
    { cellClass: MONO_CELL_CLASS, field: TOTAL_FLOAT_FIELD, headerName: "Float", width: 100 },
    {
        cellClass: MONO_CELL_CLASS,
        cellStyle: (params) =>
            params.data?.critical ? { color: "var(--colors-gold)", fontWeight: 600 } : null,
        field: CRITICAL_FIELD,
        headerName: "Critical",
        // Non-color cue for the critical path: a gold star plus the "CP" tag so the
        // signature does not rely on hue alone (accessibility).
        valueFormatter: (params) => (params.data?.critical ? CRITICAL_TAG : ""),
        width: 110,
    },
];

export function TableView(): JSX.Element {
    const collapsed = useScheduleStore((state) => state.collapsed);
    const computed = useScheduleStore((state) => state.computed);
    const dispatchOperation = useScheduleStore((state) => state.dispatchOperation);
    const graph = useScheduleStore((state) => state.graph);
    const selectActivity = useScheduleSelection((state) => state.selectActivity);

    const gridRef = useRef<AgGridReact<TableRow>>(null);

    const phaseColorIndex = useMemo(() => getPhaseColorIndex(graph.activities), [graph]);
    const rowData = useMemo(() => toTableRows(graph, computed), [computed, graph]);
    const getDataPath = useCallback<GetDataPath>((row) => (row as TableRow).path, []);
    const getRowClass = useCallback(
        (params: RowClassParams<TableRow>) => resolveTableRowClass(params.data, phaseColorIndex),
        [phaseColorIndex],
    );
    const getRowId = useCallback((params: GetRowIdParams<TableRow>) => params.data.id, []);

    // STORE -> GRID: sync collapsed set to the grid's expansion state idempotently.
    useEffect(() => {
        const api = gridRef.current?.api;
        if (api === undefined || api === null) {
            return;
        }
        api.forEachNode((node) => {
            if (!node.group) {
                return;
            }
            const id = node.id ?? "";
            const shouldBeCollapsed = collapsed.has(id);
            const isCurrentlyExpanded = node.expanded ?? false;
            if (shouldBeCollapsed === isCurrentlyExpanded) {
                node.setExpanded(!shouldBeCollapsed);
            }
        });
    }, [collapsed]);

    const onCellValueChanged = useCallback(
        (event: CellValueChangedEvent<TableRow>) => {
            if (event.colDef.field === DURATION_FIELD) {
                dispatchOperation(
                    {
                        activityId: event.data.id,
                        durationDays: Number(event.newValue),
                        kind: "resizeActivity",
                    },
                    OPERATION_ORIGIN_TABLE,
                );
            }
        },
        [dispatchOperation],
    );

    // USER -> STORE: toggle collapse in the shared store when AG-Grid group is opened/closed.
    const onRowGroupOpened = useCallback(
        (event: RowGroupOpenedEvent<TableRow>) => {
            // Guard the collapse feedback loop: the STORE -> GRID effect calls
            // node.setExpanded programmatically, which also fires this event but with
            // no browser event attached. Dispatching for that api-driven change would
            // flip the shared state back and oscillate forever. Only a user click or
            // keypress carries event.event, so dispatch solely for those.
            if (event.event === undefined || event.event === null) {
                return;
            }
            const rowId = event.node.id;
            if (rowId !== undefined && rowId !== null) {
                dispatchOperation({ kind: "toggleCollapse", rowId }, OPERATION_ORIGIN_TABLE);
            }
        },
        [dispatchOperation],
    );

    const onRowClicked = useCallback(
        (event: RowClickedEvent<TableRow>) => selectActivity(event.data?.id ?? null),
        [selectActivity],
    );

    return (
        <section aria-label="Schedule table" style={{ height: "100%", width: "100%" }}>
            <AgGridReact<TableRow>
                ref={gridRef}
                autoGroupColumnDef={AUTO_GROUP_COLUMN_DEF}
                columnDefs={COLUMN_DEFS}
                getDataPath={getDataPath}
                getRowClass={getRowClass}
                getRowId={getRowId}
                groupDefaultExpanded={-1}
                headerHeight={HEADER_HEIGHT_PX}
                onCellValueChanged={onCellValueChanged}
                onRowClicked={onRowClicked}
                onRowGroupOpened={onRowGroupOpened}
                rowData={rowData}
                rowHeight={ROW_HEIGHT_PX}
                theme={TABLE_THEME}
                treeData
            />
        </section>
    );
}
