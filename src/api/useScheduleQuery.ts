/**
 * TanStack Query hook that loads the initial schedule once and seeds the Zustand
 * store. The store owns the graph after this; the query is only the initial-load
 * transport. Exposes pending/error/refetch so the app shell can render load and
 * error states with retry.
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { fetchScheduleGraph } from "./fetchScheduleGraph";
import { useScheduleStore } from "../state/scheduleStore";

const SCHEDULE_QUERY_KEY = ["schedule"] as const;

export function useScheduleQuery(): { isError: boolean; isPending: boolean; refetch(): void } {
    const loadGraph = useScheduleStore((state) => state.loadGraph);
    const query = useQuery({ queryFn: fetchScheduleGraph, queryKey: SCHEDULE_QUERY_KEY });

    useEffect(() => {
        if (query.data !== undefined) {
            loadGraph(query.data);
        }
    }, [loadGraph, query.data]);

    return {
        isError: query.isError,
        isPending: query.isPending,
        refetch: () => void query.refetch(),
    };
}
