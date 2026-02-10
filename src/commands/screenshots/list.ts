import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, type Column, formatDate, truncate } from "../../output.js";
import { resolveProject, resolveEnvironment } from "../../config.js";

const columns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "url", header: "URL", width: 40, format: (v) => truncate(String(v ?? ""), 38) },
  { key: "status", header: "Status", width: 14 },
  { key: "format", header: "Format", width: 10 },
  { key: "createdAt", header: "Created", width: 22, format: (v) => formatDate(v as string) },
];

export function registerListCommand(parent: Command): void {
  parent
    .command("list")
    .description("List screenshots")
    .option("--limit <count>", "Max items to return", parseInt)
    .option("--cursor <cursor>", "Pagination cursor")
    .option("--status <status>", "Filter by status (pending, processing, completed, failed)")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts<{ limit?: number; cursor?: string; status?: string }>();
        const client = createClient(globalOpts);
        const project = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        const { items, nextCursor } = await client.screenshots.list({
          ...(opts.limit && { limit: opts.limit }),
          ...(opts.cursor && { cursor: opts.cursor }),
          ...(opts.status && { status: opts.status as "pending" | "processing" | "completed" | "failed" }),
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        });

        if (globalOpts.json) {
          printOutput({ items, nextCursor }, globalOpts);
          return;
        }

        printOutput(items, globalOpts, columns);

        if (nextCursor) {
          console.log(`\nNext cursor: ${nextCursor}`);
        }
      }),
    );
}
