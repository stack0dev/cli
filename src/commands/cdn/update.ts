import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, printSuccess } from "../../output.js";

export function registerUpdateCommand(cdn: Command): void {
  cdn
    .command("update <id>")
    .description("Update a CDN asset")
    .option("--name <name>", "New filename")
    .option("--description <desc>", "Asset alt text")
    .option("--tags <tags>", "Comma-separated tags")
    .option("--folder <folder>", "Move to folder")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const asset = await client.cdn.update({
          id,
          ...(localOpts.name && { filename: localOpts.name }),
          ...(localOpts.description && { alt: localOpts.description }),
          ...(localOpts.tags && { tags: localOpts.tags.split(",").map((t: string) => t.trim()) }),
          ...(localOpts.folder && { folder: localOpts.folder }),
        });

        printSuccess(`Updated asset ${id}`);
        printOutput(asset, opts);
      }),
    );
}
