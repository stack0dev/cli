import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, printSuccess } from "../../output.js";

export function registerDeleteManyCommand(cdn: Command): void {
  cdn
    .command("delete-many")
    .description("Delete multiple CDN assets")
    .requiredOption("--ids <ids>", "Comma-separated asset IDs")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();
        const ids = localOpts.ids.split(",").map((id: string) => id.trim());

        const result = await client.cdn.deleteMany(ids);

        printSuccess(`Deleted ${result.deletedCount} assets`);
        printOutput(result, opts);
      }),
    );
}
