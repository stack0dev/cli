import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { resolveProject } from "../../config.js";
import { printOutput, type Column } from "../../output.js";

const BREAKDOWN_COLUMNS: Column[] = [
  { key: "key", header: "Category" },
  { key: "count", header: "Count" },
  { key: "sizeFormatted", header: "Size" },
  { key: "percentage", header: "%", format: (v) => `${v}%` },
];

export function registerUsageCommand(cdn: Command): void {
  cdn
    .command("usage")
    .description("Show CDN usage stats for the current billing period")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts) || undefined;

        const usage = await client.cdn.getUsage({ projectSlug });
        printOutput(usage, opts);
      }),
    );

  cdn
    .command("storage-breakdown")
    .description("Show storage breakdown by type or folder")
    .option("--group-by <groupBy>", "Group by 'type' or 'folder'", "type")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts) || undefined;
        const localOpts = cmd.opts();

        const breakdown = await client.cdn.getStorageBreakdown({
          projectSlug,
          groupBy: localOpts.groupBy,
        });

        if (opts.json) {
          printOutput(breakdown, opts);
        } else {
          console.log(`Total: ${breakdown.total.sizeFormatted} (${breakdown.total.count} files)`);
          printOutput(breakdown.items, opts, BREAKDOWN_COLUMNS);
        }
      }),
    );
}
