import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, type Column } from "../../output.js";

const CONNECTOR_COLUMNS: Column[] = [
  { key: "slug", header: "Slug" },
  { key: "name", header: "Name" },
  { key: "category", header: "Category" },
  { key: "isEnabled", header: "Enabled", format: (v) => (v ? "Yes" : "No") },
];

export function registerConnectorsCommand(parent: Command): void {
  parent
    .command("connectors")
    .description("List available integration connectors")
    .option("--category <category>", "Filter by category (crm, storage, communication, productivity)")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts<{ category?: string }>();

        const connectors = await client.integrations.listConnectors(
          localOpts.category as "crm" | "storage" | "communication" | "productivity" | undefined,
        );

        printOutput(connectors, opts, CONNECTOR_COLUMNS);
      }),
    );
}
