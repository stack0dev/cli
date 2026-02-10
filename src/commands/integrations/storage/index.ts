import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { printOutput, printSuccess, formatDate, type Column } from "../../../output.js";
import { withSpinner } from "../../../spinner.js";

const FILE_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "mimeType", header: "Type" },
  { key: "size", header: "Size", format: (v) => formatBytes(v as number) },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

const FOLDER_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "path", header: "Path" },
  { key: "itemCount", header: "Items" },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function requireConnectionId(cmd: Command): string {
  const localOpts = cmd.opts<{ connectionId?: string }>();
  if (!localOpts.connectionId) {
    throw new Error("--connection-id is required.");
  }
  return localOpts.connectionId;
}

function registerFilesCommand(storage: Command): void {
  const files = new Command("files").description("Manage storage files");
  files.requiredOption("--connection-id <id>", "Connection ID");

  files
    .command("list")
    .description("List files")
    .option("--folder-id <id>", "Filter by folder ID")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ folderId?: string; limit?: string }>();

        const result = await client.integrations.storage.listFiles(
          connectionId,
          localOpts.folderId,
          { limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined },
        );

        printOutput(result.data, opts, FILE_COLUMNS);
      }),
    );

  files
    .command("get <id>")
    .description("Get file details")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        const file = await client.integrations.storage.getFile(connectionId, id);
        printOutput(file, opts);
      }),
    );

  files
    .command("upload <file>")
    .description("Upload a file")
    .option("--folder-id <id>", "Target folder ID")
    .option("--mime-type <type>", "MIME type override")
    .action(
      withErrorHandler(async (filePath: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ folderId?: string; mimeType?: string }>();

        const fileBuffer = readFileSync(filePath);
        const fileName = basename(filePath);
        const mimeType = localOpts.mimeType || "application/octet-stream";

        const file = await withSpinner("Uploading file...", async () => {
          return client.integrations.storage.uploadFile(connectionId, {
            name: fileName,
            mimeType,
            data: fileBuffer,
            folderId: localOpts.folderId,
          });
        });

        printSuccess(`Uploaded ${fileName}`);
        printOutput(file, opts);
      }),
    );

  files
    .command("download <id>")
    .description("Download a file")
    .option("-o, --output <path>", "Output file path")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ output?: string }>();

        const result = await withSpinner("Downloading file...", async () => {
          return client.integrations.storage.downloadFile(connectionId, id);
        });

        const outputPath = localOpts.output || result.filename;
        writeFileSync(outputPath, Buffer.from(result.data));
        printSuccess(`Downloaded to ${outputPath}`);
      }),
    );

  files
    .command("delete <id>")
    .description("Delete a file")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        await client.integrations.storage.deleteFile(connectionId, id);
        printSuccess(`File ${id} deleted.`);
      }),
    );

  storage.addCommand(files);
}

function registerFoldersCommand(storage: Command): void {
  const folders = new Command("folders").description("Manage storage folders");
  folders.requiredOption("--connection-id <id>", "Connection ID");

  folders
    .command("list")
    .description("List folders")
    .option("--parent-id <id>", "Filter by parent folder ID")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ parentId?: string; limit?: string }>();

        const result = await client.integrations.storage.listFolders(
          connectionId,
          localOpts.parentId,
          { limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined },
        );

        printOutput(result.data, opts, FOLDER_COLUMNS);
      }),
    );

  folders
    .command("get <id>")
    .description("Get folder details")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        const folder = await client.integrations.storage.getFolder(connectionId, id);
        printOutput(folder, opts);
      }),
    );

  folders
    .command("create")
    .description("Create a new folder")
    .requiredOption("--name <name>", "Folder name")
    .option("--parent-id <id>", "Parent folder ID")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ name: string; parentId?: string }>();

        const folder = await client.integrations.storage.createFolder(connectionId, {
          name: localOpts.name,
          parentId: localOpts.parentId,
        });

        printSuccess("Folder created.");
        printOutput(folder, opts);
      }),
    );

  folders
    .command("delete <id>")
    .description("Delete a folder")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        await client.integrations.storage.deleteFolder(connectionId, id);
        printSuccess(`Folder ${id} deleted.`);
      }),
    );

  storage.addCommand(folders);
}

export function registerStorageCommand(parent: Command): void {
  const storage = new Command("storage").description("Storage integration commands");

  registerFilesCommand(storage);
  registerFoldersCommand(storage);

  parent.addCommand(storage);
}
