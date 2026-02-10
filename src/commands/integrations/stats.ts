import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput } from "../../output.js";

export function registerStatsCommand(parent: Command): void {
  parent
    .command("stats")
    .description("Show integration statistics")
    .option("--environment <env>", "Filter by environment (sandbox, production)")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts<{ environment?: string }>();

        const stats = await client.integrations.getStats({
          environment: localOpts.environment as "sandbox" | "production" | undefined,
        });

        printOutput(stats, opts);
      }),
    );
}
