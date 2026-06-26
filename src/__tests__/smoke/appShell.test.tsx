import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AppShell } from "../../components/AppShell/AppShell";

describe("AppShell", () => {
    test("mounts and exposes the labelled application region", () => {
        render(<AppShell />);
        expect(screen.getByRole("main", { name: "Planera schedule editor" })).toBeInTheDocument();
    });
});
