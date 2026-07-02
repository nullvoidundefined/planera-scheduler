import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { JSX, ReactNode } from "react";
import { describe, expect, test } from "vitest";

import { useScheduleQuery } from "../../state/useScheduleQuery";
import { useScheduleStore } from "../../state/scheduleStore";

function wrapper({ children }: { children: ReactNode }): JSX.Element {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useScheduleQuery", () => {
    test("loads the fetched graph into the schedule store", async () => {
        const { result } = renderHook(() => useScheduleQuery(), { wrapper });
        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(result.current.isError).toBe(false);
        expect(useScheduleStore.getState().graph.activities.length).toBeGreaterThan(0);
        expect(useScheduleStore.getState().computed.size).toBeGreaterThan(0);
    });
});
