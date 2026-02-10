import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, printSuccess } from "../../output.js";

export function registerMoveCommand(cdn: Command): void {
  cdn
    .command("move")
    .description("Move assets to a different folder")
    .requiredOption("--ids <ids>", "Comma-separated asset IDs")
    .requiredOption("--folder-id <folderId>", "Target folder path (or 'null' for root)")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();
        const assetIds = localOpts.ids.split(",").map((id: string) => id.trim());
        const folder = localOpts.folderId === "null" ? null : localOpts.folderId;

        const result = await client.cdn.move({ assetIds, folder });

        printSuccess(`Moved ${result.movedCount} assets`);
        printOutput(result, opts);
      }),
    );
}
