import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printSuccess } from "../../output.js";

export function registerDeleteCommand(cdn: Command): void {
  cdn
    .command("delete <id>")
    .description("Delete a CDN asset")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        await client.cdn.delete(id);
        printSuccess(`Deleted asset ${id}`);
      }),
    );
}
