import { Command } from "commander";
import { registerConnectorsCommand } from "./connectors.js";
import { registerConnectionsCommand } from "./connections.js";
import { registerStatsCommand } from "./stats.js";
import { registerLogsCommand } from "./logs.js";
import { registerCrmCommand } from "./crm/index.js";
import { registerStorageCommand } from "./storage/index.js";
import { registerCommunicationCommand } from "./communication/index.js";
import { registerProductivityCommand } from "./productivity/index.js";

export function registerIntegrationsCommand(parent: Command): void {
  const integrations = new Command("integrations").description("Manage third-party integrations");

  registerConnectorsCommand(integrations);
  registerConnectionsCommand(integrations);
  registerStatsCommand(integrations);
  registerLogsCommand(integrations);
  registerCrmCommand(integrations);
  registerStorageCommand(integrations);
  registerCommunicationCommand(integrations);
  registerProductivityCommand(integrations);

  parent.addCommand(integrations);
}
