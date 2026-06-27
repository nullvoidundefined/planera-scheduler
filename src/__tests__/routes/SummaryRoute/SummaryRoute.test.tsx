import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { SummaryRoute } from "../../../routes/SummaryRoute/SummaryRoute";

function renderRoute(): void {
    render(
        <MemoryRouter>
            <SummaryRoute />
        </MemoryRouter>,
    );
}

describe("SummaryRoute", () => {
    test("renders one h1 and the body copy", () => {
        renderRoute();
        expect(
            screen.getByRole("heading", { level: 1, name: "I built you a Planera demo" }),
        ).toBeInTheDocument();
        expect(screen.getByText(/instead of a cover letter/)).toBeInTheDocument();
    });

    test("offers the two calls to action", () => {
        renderRoute();
        expect(screen.getByRole("link", { name: "Open the demo" })).toHaveAttribute(
            "href",
            "/demo",
        );
        expect(screen.getByRole("link", { name: "Read the write-up" })).toHaveAttribute(
            "href",
            "/architecture",
        );
    });
});
