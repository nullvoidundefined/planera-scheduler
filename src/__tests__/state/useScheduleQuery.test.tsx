import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { JSX, ReactNode } from "react";
import { describe, expect, test } from "vitest";

import { useScheduleStore } from "../../state/scheduleStore";
import { useScheduleQuery } from "../../state/useScheduleQuery";

function wrapper({ children }: { children: ReactNode }): JSX.Element {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useScheduleQuery", () => {
    test("loads the fetched graph into the schedule store", async () => {
        const { result } = renderHook(() => useScheduleQuery(), { wrapper });
        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(result.current.isError).toBe(false);

        const { computed, graph } = useScheduleStore.getState();
        const leafCount = graph.activities.filter((activity) => activity.type !== "group").length;
        expect(leafCount).toBeGreaterThan(0);
        // Every leaf ends up computed: the hook loaded the fetched graph and the full
        // CPM pass ran over all of it, not just some arbitrary non-empty subset.
        expect(computed.size).toBe(leafCount);
    });
});
