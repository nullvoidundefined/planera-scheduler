/**
 * Route table for the portfolio site: the shared SiteShell wraps the Summary (index),
 * Demo, and Architecture routes. appRoutes is exported on its own so tests can build a
 * memory router from the same definitions the browser router uses.
 */
import { createBrowserRouter, type RouteObject } from "react-router-dom";

import { SiteShell } from "../components/SiteShell/SiteShell";
import { ArchitectureRoute } from "../routes/ArchitectureRoute/ArchitectureRoute";
import { DemoRoute } from "../routes/DemoRoute/DemoRoute";
import { SummaryRoute } from "../routes/SummaryRoute/SummaryRoute";

export const appRoutes: RouteObject[] = [
    {
        children: [
            { element: <SummaryRoute />, index: true },
            { element: <DemoRoute />, path: "demo" },
            { element: <ArchitectureRoute />, path: "architecture" },
        ],
        element: <SiteShell />,
    },
];

export const appRouter = createBrowserRouter(appRoutes);
