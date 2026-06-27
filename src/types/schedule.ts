/**
 * Domain types for the unified CPM node model. The schedule is a directed acyclic
 * graph: activities are nodes (tasks, milestones, or group rollups), dependencies
 * are a separate edge list. Projects and phases are group-type activities; the WBS
 * encodes the tree path and parentId builds the hierarchy. Dates are never stored;
 * ComputedActivity holds the engine's outputs.
 */
import { RELATIONSHIP_TYPES } from "../constants/schedule";

export type ActivityType = "task" | "milestone" | "group";

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface Activity {
    durationDays: number;
    id: string;
    name: string;
    parentId: string | null;
    type: ActivityType;
    wbs: string;
}

export interface ComputedActivity {
    earlyFinish: number;
    earlyStart: number;
    id: string;
    isCritical: boolean;
    lateFinish: number;
    lateStart: number;
    totalFloat: number;
}

export interface Dependency {
    id: string;
    lagDays: number;
    predecessorId: string;
    successorId: string;
    type: RelationshipType;
}

export interface ScheduleGraph {
    activities: Activity[];
    dependencies: Dependency[];
}

export function isRelationshipType(value: string): value is RelationshipType {
    return (RELATIONSHIP_TYPES as readonly string[]).includes(value);
}
