import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput } from "../../output.js";

export function registerGetCommand(cdn: Command): void {
  cdn
    .command("get <id>")
    .description("Get a CDN asset by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const asset = await client.cdn.get(id);
        printOutput(asset, opts);
      }),
    );
}
