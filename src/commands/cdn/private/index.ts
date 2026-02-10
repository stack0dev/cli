import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject } from "../../../config.js";
import { printOutput, printSuccess, formatDate, type Column } from "../../../output.js";
import { withSpinner } from "../../../spinner.js";
import { lookup } from "../../../mime.js";

const PRIVATE_FILE_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "filename", header: "Name" },
  { key: "mimeType", header: "Type" },
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

export function registerPrivateCommand(cdn: Command): void {
  const priv = cdn.command("private").description("Manage private files");

  priv
    .command("upload <file>")
    .description("Upload a private file")
    .option("--folder <folder>", "Target folder path")
    .option("--description <desc>", "File description")
    .action(
      withErrorHandler(async (file: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const fileBuffer = readFileSync(file);
        const fileName = basename(file);
        const mimeType = lookup(fileName) || "application/octet-stream";

        const privateFile = await withSpinner("Uploading private file...", async (spinner) => {
          const result = await client.cdn.uploadPrivate({
            projectSlug,
            file: fileBuffer,
            filename: fileName,
            mimeType,
            folder: localOpts.folder,
            description: localOpts.description,
          });
          spinner.text = "Upload complete";
          return result;
        });

        printSuccess(`Uploaded ${fileName}`);
        printOutput(privateFile, opts);
      }),
    );

  priv
    .command("list")
    .description("List private files")
    .option("--limit <n>", "Maximum results", "20")
    .option("--offset <n>", "Offset for pagination", "0")
    .option("--folder <folder>", "Filter by folder")
    .option("--status <status>", "Filter by status")
    .option("--search <query>", "Search by filename")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const { files, total } = await client.cdn.listPrivateFiles({
          projectSlug,
          folder: localOpts.folder,
          status: localOpts.status,
          search: localOpts.search,
          limit: parseInt(localOpts.limit, 10),
          offset: parseInt(localOpts.offset, 10),
        });

        if (opts.json) {
          printOutput({ files, total }, opts);
        } else {
          console.log(`Total: ${total}`);
          printOutput(files, opts, PRIVATE_FILE_COLUMNS);
        }
      }),
    );

  priv
    .command("get <id>")
    .description("Get a private file by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const file = await client.cdn.getPrivateFile(id);
        printOutput(file, opts);
      }),
    );

  priv
    .command("download <id>")
    .description("Get a download URL for a private file")
    .option("--output <path>", "Download and save to file path")
    .option("--expires-in <seconds>", "URL expiration in seconds", "3600")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const { downloadUrl, expiresAt } = await client.cdn.getPrivateDownloadUrl({
          fileId: id,
          expiresIn: parseInt(localOpts.expiresIn, 10),
        });

        if (localOpts.output) {
          await withSpinner("Downloading file...", async () => {
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

  priv
    .command("update <id>")
    .description("Update a private file")
    .option("--description <desc>", "File description")
    .option("--tags <tags>", "Comma-separated tags")
    .option("--folder <folder>", "Move to folder")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const file = await client.cdn.updatePrivateFile({
          fileId: id,
          ...(localOpts.description && { description: localOpts.description }),
          ...(localOpts.tags && { tags: localOpts.tags.split(",").map((t: string) => t.trim()) }),
          ...(localOpts.folder !== undefined && { folder: localOpts.folder }),
        });

        printSuccess(`Updated private file ${id}`);
        printOutput(file, opts);
      }),
    );

  priv
    .command("delete <id>")
    .description("Delete a private file")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        await client.cdn.deletePrivateFile(id);
        printSuccess(`Deleted private file ${id}`);
      }),
    );

  priv
    .command("move")
    .description("Move private files to a different folder")
    .requiredOption("--ids <ids>", "Comma-separated file IDs")
    .requiredOption("--folder-id <folderId>", "Target folder path (or 'null' for root)")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();
        const fileIds = localOpts.ids.split(",").map((id: string) => id.trim());
        const folder = localOpts.folderId === "null" ? null : localOpts.folderId;

        const result = await client.cdn.movePrivateFiles({ fileIds, folder });

        printSuccess(`Moved ${result.movedCount} files`);
        printOutput(result, opts);
      }),
    );
}
