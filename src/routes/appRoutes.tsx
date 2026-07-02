/**
 * Route table for the portfolio site: the shared SiteShell wraps the Summary (index),
 * Demo, and Architecture routes. appRoutes is exported on its own so tests can build a
 * memory router from the same definitions the browser router uses.
 */
import { createBrowserRouter, type RouteObject } from "react-router-dom";

import { SiteShell } from "../components/SiteShell/SiteShell";
import { ROUTE_ARCHITECTURE_SEGMENT, ROUTE_DEMO_SEGMENT } from "../constants/routes";

import { ArchitectureRoute } from "./ArchitectureRoute";
import { DemoRoute } from "./DemoRoute";
import { SummaryRoute } from "./SummaryRoute";

export const appRoutes: RouteObject[] = [
    {
        children: [
            { element: <SummaryRoute />, index: true },
            { element: <DemoRoute />, path: ROUTE_DEMO_SEGMENT },
            { element: <ArchitectureRoute />, path: ROUTE_ARCHITECTURE_SEGMENT },
        ],
        element: <SiteShell />,
    },
];

export const appRouter = createBrowserRouter(appRoutes);
