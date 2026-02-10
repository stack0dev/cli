import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, formatDate, type Column } from "../../output.js";

const CONNECTION_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "status", header: "Status" },
  { key: "connectedAt", header: "Connected", format: (v) => formatDate(v as string) },
  { key: "lastUsedAt", header: "Last Used", format: (v) => formatDate(v as string) },
];

export function registerConnectionsCommand(parent: Command): void {
  const connections = new Command("connections").description("Manage integration connections");

  connections
    .command("list")
    .description("List all connections")
    .option("--status <status>", "Filter by status (pending, connected, error, disconnected)")
    .option("--connector <slug>", "Filter by connector slug")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts<{ status?: string; connector?: string; limit?: string }>();

        const result = await client.integrations.listConnections({
          status: localOpts.status as "pending" | "connected" | "error" | "disconnected" | undefined,
          connectorSlug: localOpts.connector,
          limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined,
        });

        printOutput(result.connections, opts, CONNECTION_COLUMNS);
      }),
    );

  connections
    .command("get <id>")
    .description("Get connection details")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connection = await client.integrations.getConnection(id);
        printOutput(connection, opts);
      }),
    );

  parent.addCommand(connections);
}
