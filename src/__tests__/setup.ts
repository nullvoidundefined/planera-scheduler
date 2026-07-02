import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "../mocks/mswNodeServer";

globalThis.ResizeObserver = class ResizeObserver {
    disconnect(): void {}
    observe(): void {}
    unobserve(): void {}
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
