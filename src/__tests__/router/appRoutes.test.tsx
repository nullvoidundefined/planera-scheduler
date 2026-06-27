import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { appRoutes } from "../../router/appRoutes";

function renderAt(path: string): void {
    const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
    render(<RouterProvider router={router} />);
}

describe("site routing", () => {
    test("renders the Summary route at /", () => {
        renderAt("/");
        expect(
            screen.getByRole("heading", { level: 1, name: "I built you a Planera demo" }),
        ).toBeInTheDocument();
    });

    test("navigates from Summary to the write-up via the nav", async () => {
        const user = userEvent.setup();
        renderAt("/");
        await user.click(screen.getByRole("link", { name: "Write-up" }));
        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "How I think Planera's frontend is built",
            }),
        ).toBeInTheDocument();
    });
});
