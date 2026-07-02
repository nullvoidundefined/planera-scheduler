/**
 * Registers AllEnterpriseModule exactly once. Using the all-in-one bundle
 * prevents AG-Grid error #200 (feature disabled because module not registered)
 * when later tasks add editing, cellStyle, or other feature modules. The
 * Enterprise evaluation watermark is accepted for this hiring artifact.
 */
import { ModuleRegistry } from "ag-grid-community";
import { AllEnterpriseModule } from "ag-grid-enterprise";

let isRegistered = false;

export function registerGridModules(): void {
    if (isRegistered) {
        return;
    }
    ModuleRegistry.registerModules([AllEnterpriseModule]);
    isRegistered = true;
}
