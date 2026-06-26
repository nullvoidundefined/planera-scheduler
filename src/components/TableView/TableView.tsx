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
    RowClickedEvent,
    ValueSetterParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo } from "react";
import type { JSX } from "react";

import { registerGridModules } from "./registerGridModules";
import type { TableRow } from "./toTableRows";
import { toTableRows } from "./toTableRows";
import { createCalendar } from "../../services/createCalendar";
import { formatScheduleDate } from "../../services/formatScheduleDate";
import { useScheduleStore } from "../../state/scheduleStore";
import { useScheduleSelection } from "../../state/useScheduleSelection";

registerGridModules();

const CALENDAR = createCalendar();

const DURATION_FIELD = "duration";

const AUTO_GROUP_COLUMN_DEF: ColDef<TableRow> = {
    field: "name",
    headerName: "Activity",
    minWidth: 280,
};

const COLUMN_DEFS: ColDef<TableRow>[] = [
    { field: "wbs", headerName: "WBS", width: 120 },
    {
        editable: (params) => params.data?.type !== "group",
        field: DURATION_FIELD,
        headerName: "Duration (d)",
        valueSetter: (params: ValueSetterParams<TableRow>) => {
            const next = Number(params.newValue);
            return Number.isFinite(next) && next >= 0;
        },
        width: 130,
    },
    {
        field: "earlyStart",
        headerName: "Start",
        valueFormatter: (params) => formatScheduleDate(Number(params.value), CALENDAR),
        width: 130,
    },
    {
        field: "earlyFinish",
        headerName: "Finish",
        valueFormatter: (params) => formatScheduleDate(Number(params.value), CALENDAR),
        width: 130,
    },
    { field: "totalFloat", headerName: "Float", width: 100 },
    {
        cellStyle: (params) => (params.data?.critical ? { color: "var(--critical-text, #b42318)" } : null),
        field: "critical",
        headerName: "Critical",
        width: 110,
    },
];

export function TableView(): JSX.Element {
    const computed = useScheduleStore((state) => state.computed);
    const dispatchOperation = useScheduleStore((state) => state.dispatchOperation);
    const graph = useScheduleStore((state) => state.graph);
    const selectActivity = useScheduleSelection((state) => state.selectActivity);

    const rowData = useMemo(() => toTableRows(graph, computed), [computed, graph]);
    const getDataPath = useCallback<GetDataPath>((row) => (row as TableRow).path, []);
    const getRowId = useCallback((params: { data: TableRow }) => params.data.id, []);

    const onCellValueChanged = useCallback(
        (event: CellValueChangedEvent<TableRow>) => {
            if (event.colDef.field === DURATION_FIELD) {
                dispatchOperation({
                    activityId: event.data.id,
                    durationDays: Number(event.newValue),
                    kind: "resizeActivity",
                });
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
                autoGroupColumnDef={AUTO_GROUP_COLUMN_DEF}
                columnDefs={COLUMN_DEFS}
                getDataPath={getDataPath}
                getRowId={getRowId}
                groupDefaultExpanded={-1}
                onCellValueChanged={onCellValueChanged}
                onRowClicked={onRowClicked}
                rowData={rowData}
                treeData
            />
        </section>
    );
}
