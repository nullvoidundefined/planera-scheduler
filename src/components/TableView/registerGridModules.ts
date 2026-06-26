/**
 * Registers the AG-Grid modules the table needs exactly once: the Community
 * client-side row model plus the Enterprise Tree Data module. The Enterprise
 * evaluation watermark is accepted for this hiring artifact.
 */
import { ClientSideRowModelModule, ModuleRegistry } from "ag-grid-community";
import { TreeDataModule } from "ag-grid-enterprise";

let registered = false;

export function registerGridModules(): void {
    if (registered) {
        return;
    }
    ModuleRegistry.registerModules([ClientSideRowModelModule, TreeDataModule]);
    registered = true;
}
