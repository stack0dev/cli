import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { resolveProject } from "../../config.js";
import { printOutput, formatDate, type Column } from "../../output.js";

const ASSET_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "filename", header: "Name" },
  { key: "type", header: "Type" },
  { key: "size", header: "Size", format: (v) => formatBytes(v as number) },
  { key: "status", header: "Status" },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function registerListCommand(cdn: Command): void {
  cdn
    .command("list")
    .description("List CDN assets")
    .option("--limit <n>", "Maximum number of results", "20")
    .option("--offset <n>", "Offset for pagination", "0")
    .option("--folder-id <id>", "Filter by folder")
    .option("--type <type>", "Filter by type (image, video, audio, document, other)")
    .option("--status <status>", "Filter by status")
    .option("--search <query>", "Search by filename")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default with `stack0 config set project <slug>`.");
        }

        const localOpts = cmd.opts();
        const { assets, total } = await client.cdn.list({
          projectSlug,
          folder: localOpts.folderId,
          type: localOpts.type,
          status: localOpts.status,
          search: localOpts.search,
          limit: parseInt(localOpts.limit, 10),
          offset: parseInt(localOpts.offset, 10),
        });

        if (opts.json) {
          printOutput({ assets, total }, opts);
        } else {
          console.log(`Total: ${total}`);
          printOutput(assets, opts, ASSET_COLUMNS);
        }
      }),
    );
}
