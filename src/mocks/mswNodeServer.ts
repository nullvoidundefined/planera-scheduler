/** MSW node server for Vitest. */
import { setupServer } from "msw/node";

import { handlers } from "./scheduleApiHandlers";

export const server = setupServer(...handlers);
