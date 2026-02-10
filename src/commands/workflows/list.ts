import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { resolveProject, resolveEnvironment } from "../../config.js";
import { printOutput, formatDate, truncate, type Column } from "../../output.js";

const columns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "name", header: "Name", width: 24, format: (v) => truncate(String(v ?? ""), 22) },
  { key: "slug", header: "Slug", width: 22 },
  { key: "version", header: "Version", width: 10 },
  { key: "isActive", header: "Status", width: 10, format: (v) => (v ? "active" : "inactive") },
  { key: "updatedAt", header: "Updated", width: 22, format: (v) => formatDate(v as string) },
];

export function registerListCommand(parent: Command): void {
  parent
    .command("list")
    .description("List workflows")
    .option("--limit <n>", "Maximum number of results", parseInt)
    .option("--cursor <cursor>", "Pagination cursor")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);
        const projectSlug = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts) as "sandbox" | "production" | undefined;

        const result = await client.workflows.list({
          ...(opts.limit && { limit: opts.limit }),
          ...(opts.cursor && { cursor: opts.cursor }),
          ...(projectSlug && { projectSlug }),
          ...(environment && { environment }),
        });

        printOutput(result.items, globalOpts, columns);
      })
    );
}
