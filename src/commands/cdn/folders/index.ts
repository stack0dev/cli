import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject } from "../../../config.js";
import { printOutput, printSuccess, formatDate, type Column } from "../../../output.js";

const FOLDER_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "path", header: "Path" },
  { key: "assetCount", header: "Assets" },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

function printTree(nodes: Array<{ name: string; path: string; assetCount: number; children: unknown[] }>, indent = ""): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const prefix = isLast ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ";
    console.log(`${indent}${prefix}${node.name} (${node.assetCount} assets)`);
    const childIndent = indent + (isLast ? "    " : "\u2502   ");
    if (node.children?.length) {
      printTree(node.children as typeof nodes, childIndent);
    }
  }
}

export function registerFoldersCommand(cdn: Command): void {
  const folders = cdn.command("folders").description("Manage CDN folders");

  folders
    .command("list")
    .description("List folders")
    .option("--parent-id <id>", "Filter by parent folder")
    .option("--limit <n>", "Maximum results", "50")
    .option("--offset <n>", "Offset for pagination", "0")
    .option("--search <query>", "Search by name")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const { folders: folderList, total } = await client.cdn.listFolders({
          parentId: localOpts.parentId,
          limit: parseInt(localOpts.limit, 10),
          offset: parseInt(localOpts.offset, 10),
          search: localOpts.search,
        });

        if (opts.json) {
          printOutput({ folders: folderList, total }, opts);
        } else {
          console.log(`Total: ${total}`);
          printOutput(folderList, opts, FOLDER_COLUMNS);
        }
      }),
    );

  folders
    .command("tree")
    .description("Show folder tree")
    .option("--max-depth <n>", "Maximum tree depth")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const tree = await client.cdn.getFolderTree({
          projectSlug,
          maxDepth: localOpts.maxDepth ? parseInt(localOpts.maxDepth, 10) : undefined,
        });

        if (opts.json) {
          printOutput(tree, opts);
        } else {
          if (tree.length === 0) {
            console.log("No folders found.");
          } else {
            printTree(tree);
          }
        }
      }),
    );

  folders
    .command("create")
    .description("Create a folder")
    .requiredOption("--name <name>", "Folder name")
    .option("--parent-id <id>", "Parent folder ID")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const folder = await client.cdn.createFolder({
          projectSlug,
          name: localOpts.name,
          parentId: localOpts.parentId,
        });

        printSuccess(`Created folder "${folder.name}"`);
        printOutput(folder, opts);
      }),
    );

  folders
    .command("get <id>")
    .description("Get a folder by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const folder = await client.cdn.getFolder(id);
        printOutput(folder, opts);
      }),
    );

  folders
    .command("update <id>")
    .description("Update a folder")
    .option("--name <name>", "New folder name")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const folder = await client.cdn.updateFolder({
          id,
          ...(localOpts.name && { name: localOpts.name }),
        });

        printSuccess(`Updated folder ${id}`);
        printOutput(folder, opts);
      }),
    );

  folders
    .command("move <id>")
    .description("Move a folder to a new parent")
    .requiredOption("--parent-id <id>", "New parent folder ID (or 'null' for root)")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();
        const newParentId = localOpts.parentId === "null" ? null : localOpts.parentId;

        await client.cdn.moveFolder({ id, newParentId });
        printSuccess(`Moved folder ${id}`);
      }),
    );

  folders
    .command("delete <id>")
    .description("Delete a folder")
    .option("--delete-contents", "Also delete folder contents")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        await client.cdn.deleteFolder(id, localOpts.deleteContents);
        printSuccess(`Deleted folder ${id}`);
      }),
    );
}
