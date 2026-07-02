/** MSW browser worker for the Vite dev server. */
import { setupWorker } from "msw/browser";

import { handlers } from "./scheduleApiHandlers";

export const worker = setupWorker(...handlers);
