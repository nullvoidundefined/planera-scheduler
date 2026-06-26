/**
 * Registers AllEnterpriseModule exactly once. Using the all-in-one bundle
 * prevents AG-Grid error #200 (feature disabled because module not registered)
 * when later tasks add editing, cellStyle, or other feature modules. The
 * Enterprise evaluation watermark is accepted for this hiring artifact.
 */
import { ModuleRegistry } from "ag-grid-community";
import { AllEnterpriseModule } from "ag-grid-enterprise";

let registered = false;

export function registerGridModules(): void {
    if (registered) {
        return;
    }
    ModuleRegistry.registerModules([AllEnterpriseModule]);
    registered = true;
}
