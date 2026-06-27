import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { DemoCaption } from "../../../components/DemoCaption/DemoCaption";

describe("DemoCaption", () => {
    test("shows guidance and can be dismissed", async () => {
        const user = userEvent.setup();
        render(<DemoCaption />);
        const aside = screen.getByRole("complementary", { name: "How to explore the demo" });
        expect(aside).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Dismiss" }));
        expect(
            screen.queryByRole("complementary", { name: "How to explore the demo" }),
        ).not.toBeInTheDocument();
    });
});
