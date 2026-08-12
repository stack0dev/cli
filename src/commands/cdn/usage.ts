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

const STORAGE_TYPE_COLUMNS: Column[] = [
  { key: "type", header: "Type" },
  { key: "bytesFormatted", header: "Size" },
  { key: "objectCount", header: "Objects" },
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
    .command("storage")
    .description("Show total stored bytes, including derived assets")
    .option("--folder <path>", "Scope to a folder and everything nested under it")
    .option("--environment <env>", "Filter by 'sandbox' or 'production'")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts) || undefined;
        const localOpts = cmd.opts();

        const usage = await client.cdn.getStorageUsage({
          projectSlug,
          folder: localOpts.folder,
          environment: localOpts.environment,
        });

        if (opts.json) {
          printOutput(usage, opts);
          return;
        }

        const scope = usage.folder ? ` under ${usage.folder}` : "";
        console.log(`Total: ${usage.totalFormatted} across ${usage.objectCount} objects${scope}`);
        console.log(
          `  uploads: ${usage.breakdown.originals.bytesFormatted} (${usage.breakdown.originals.objectCount} objects)`,
        );
        console.log(
          `  derived: ${usage.breakdown.derived.bytesFormatted} (${usage.breakdown.derived.objectCount} objects)`,
        );

        const rows = Object.entries(usage.byType).map(([type, bucket]) => ({
          type,
          ...(bucket as Record<string, unknown>),
        }));
        if (rows.length > 0) {
          console.log("");
          printOutput(rows, opts, STORAGE_TYPE_COLUMNS);
        }

        // A floor is not a total. Say so rather than let the number read as complete.
        if (usage.unmeasuredAssets > 0) {
          console.log("");
          console.log(
            `Warning: ${usage.unmeasuredAssets} assets have unmeasured derived files, so this total is a floor.`,
          );
        }
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
