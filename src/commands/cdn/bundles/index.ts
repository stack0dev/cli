import { writeFileSync } from "node:fs";
import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject } from "../../../config.js";
import { printOutput, printSuccess, formatDate, type Column } from "../../../output.js";
import { withSpinner } from "../../../spinner.js";

const BUNDLE_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "status", header: "Status" },
  { key: "fileCount", header: "Files" },
  { key: "size", header: "Size", format: (v) => formatBytes(v as number) },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function registerBundlesCommand(cdn: Command): void {
  const bundles = cdn.command("bundles").description("Manage download bundles");

  bundles
    .command("create")
    .description("Create a download bundle")
    .requiredOption("--name <name>", "Bundle name")
    .option("--asset-ids <ids>", "Comma-separated asset IDs")
    .option("--private-file-ids <ids>", "Comma-separated private file IDs")
    .option("--description <desc>", "Bundle description")
    .option("--expires-in <seconds>", "Expiration in seconds", "86400")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const { bundle } = await withSpinner("Creating bundle...", async () => {
          return client.cdn.createBundle({
            projectSlug,
            name: localOpts.name,
            description: localOpts.description,
            assetIds: localOpts.assetIds?.split(",").map((id: string) => id.trim()),
            privateFileIds: localOpts.privateFileIds?.split(",").map((id: string) => id.trim()),
            expiresIn: parseInt(localOpts.expiresIn, 10),
          });
        });

        printSuccess(`Created bundle: ${bundle.id}`);
        printOutput(bundle, opts);
      }),
    );

  bundles
    .command("list")
    .description("List download bundles")
    .option("--status <status>", "Filter by status")
    .option("--search <query>", "Search by name")
    .option("--limit <n>", "Maximum results", "20")
    .option("--offset <n>", "Offset for pagination", "0")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const { bundles: bundleList, total } = await client.cdn.listBundles({
          projectSlug,
          status: localOpts.status,
          search: localOpts.search,
          limit: parseInt(localOpts.limit, 10),
          offset: parseInt(localOpts.offset, 10),
        });

        if (opts.json) {
          printOutput({ bundles: bundleList, total }, opts);
        } else {
          console.log(`Total: ${total}`);
          printOutput(bundleList, opts, BUNDLE_COLUMNS);
        }
      }),
    );

  bundles
    .command("get <id>")
    .description("Get a bundle by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const bundle = await client.cdn.getBundle(id);
        printOutput(bundle, opts);
      }),
    );

  bundles
    .command("download <id>")
    .description("Get a download URL for a bundle")
    .option("--output <path>", "Download and save to file path")
    .option("--expires-in <seconds>", "URL expiration in seconds", "3600")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const { downloadUrl, expiresAt } = await client.cdn.getBundleDownloadUrl({
          bundleId: id,
          expiresIn: parseInt(localOpts.expiresIn, 10),
        });

        if (localOpts.output) {
          await withSpinner("Downloading bundle...", async () => {
            const response = await fetch(downloadUrl);
            if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
            const buffer = Buffer.from(await response.arrayBuffer());
            writeFileSync(localOpts.output, buffer);
          });
          printSuccess(`Downloaded to ${localOpts.output}`);
        } else {
          printOutput({ downloadUrl, expiresAt }, opts);
        }
      }),
    );

  bundles
    .command("delete <id>")
    .description("Delete a bundle")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        await client.cdn.deleteBundle(id);
        printSuccess(`Deleted bundle ${id}`);
      }),
    );
}
