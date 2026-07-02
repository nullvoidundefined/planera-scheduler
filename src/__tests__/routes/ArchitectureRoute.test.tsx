import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { ARCHITECTURE_SECTIONS } from "../../data/architectureSections";
import { ArchitectureRoute } from "../../routes/ArchitectureRoute";

function renderRoute(): void {
    render(
        <MemoryRouter>
            <ArchitectureRoute />
        </MemoryRouter>,
    );
}

describe("ArchitectureRoute", () => {
    test("renders exactly one h1", () => {
        renderRoute();
        expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "My outside read of how Planera's frontend is built",
            }),
        ).toBeInTheDocument();
    });

    test("renders every build-system section heading", () => {
        renderRoute();
        for (const section of ARCHITECTURE_SECTIONS) {
            expect(
                screen.getByRole("heading", { level: 2, name: section.heading }),
            ).toBeInTheDocument();
        }
    });

    test("renders the AI-first section heading", () => {
        renderRoute();
        expect(
            screen.getByRole("heading", { level: 2, name: "How I built this" }),
        ).toBeInTheDocument();
    });

    test("links to the source repo under its own heading near the top", () => {
        renderRoute();
        expect(screen.getByRole("heading", { level: 2, name: "The source" })).toBeInTheDocument();
        const repoLink = screen.getByRole("link", {
            name: "github.com/nullvoidundefined/planera-scheduler",
        });
        expect(repoLink).toHaveAttribute(
            "href",
            "https://github.com/nullvoidundefined/planera-scheduler",
        );
        expect(repoLink).toHaveAttribute("rel", "noopener noreferrer");
    });
});
