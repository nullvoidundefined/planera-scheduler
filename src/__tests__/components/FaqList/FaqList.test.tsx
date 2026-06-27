import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { FaqList } from "../../../components/FaqList/FaqList";
import type { FaqEntry } from "../../../types/prose";

const ENTRIES: FaqEntry[] = [
    { answer: "Because it was fun.", question: "Why build this?" },
    { answer: "No, single-user.", question: "Is it real-time?" },
];

describe("FaqList", () => {
    test("renders each question as a disclosure with its answer", () => {
        render(<FaqList entries={ENTRIES} />);
        expect(screen.getByText("Why build this?")).toBeInTheDocument();
        expect(screen.getByText("Because it was fun.")).toBeInTheDocument();
        expect(screen.getByText("Is it real-time?")).toBeInTheDocument();
    });
});
