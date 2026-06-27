/** Application root: provides the client-side router for the three-route portfolio site. */
import type { JSX } from "react";
import { RouterProvider } from "react-router-dom";

import { appRouter } from "./router/appRoutes";

export function App(): JSX.Element {
    return <RouterProvider router={appRouter} />;
}
