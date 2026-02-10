import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, formatDate, type Column } from "../../output.js";

const LOG_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "method", header: "Method" },
  { key: "path", header: "Path" },
  { key: "statusCode", header: "Status" },
  { key: "requestDurationMs", header: "Duration (ms)" },
  { key: "connectorName", header: "Connector" },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

export function registerLogsCommand(parent: Command): void {
  parent
    .command("logs")
    .description("List integration API logs")
    .option("--connection-id <id>", "Filter by connection ID")
    .option("--connector <slug>", "Filter by connector slug")
    .option("--status-code <code>", "Filter by HTTP status code")
    .option("--method <method>", "Filter by HTTP method")
    .option("--search <query>", "Search logs")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts<{
          connectionId?: string;
          connector?: string;
          statusCode?: string;
          method?: string;
          search?: string;
          limit?: string;
        }>();

        const result = await client.integrations.listLogs({
          connectionId: localOpts.connectionId,
          connectorSlug: localOpts.connector,
          statusCode: localOpts.statusCode ? parseInt(localOpts.statusCode, 10) : undefined,
          method: localOpts.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | undefined,
          search: localOpts.search,
          limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined,
        });

        printOutput(result.logs, opts, LOG_COLUMNS);
      }),
    );
}
