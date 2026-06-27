import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { SiteNav } from "../../../components/SiteNav/SiteNav";

describe("SiteNav", () => {
    test("renders the three site links with correct destinations", () => {
        render(
            <MemoryRouter>
                <SiteNav />
            </MemoryRouter>,
        );
        expect(screen.getByRole("link", { name: "Summary" })).toHaveAttribute("href", "/");
        expect(screen.getByRole("link", { name: "Demo" })).toHaveAttribute("href", "/demo");
        expect(screen.getByRole("link", { name: "Write-up" })).toHaveAttribute(
            "href",
            "/architecture",
        );
    });
});
