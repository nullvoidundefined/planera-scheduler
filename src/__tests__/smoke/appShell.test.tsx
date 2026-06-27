import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AppShell } from "../../components/AppShell/AppShell";

describe("AppShell", () => {
    test("mounts and exposes the labelled application region", () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={client}>
                <AppShell />
            </QueryClientProvider>,
        );
        expect(screen.getByRole("main", { name: "Planera schedule editor" })).toBeInTheDocument();
    });
});
