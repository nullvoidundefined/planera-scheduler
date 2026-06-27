/**
 * The number of distinct pastel hues in the schedule phase palette. Phase color
 * indices cycle through this many hues (0-based), so the Nth phase reuses the hue
 * of the (N - PHASE_PALETTE_SIZE)th. Shared by getPhaseColorIndex and the Gantt /
 * Table class resolvers so every surface agrees on how many colors exist.
 */
export const PHASE_PALETTE_SIZE = 8;
