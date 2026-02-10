import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, type Column } from "../../output.js";
import { resolveEnvironment } from "../../config.js";

const dailyColumns: Column[] = [
  { key: "date", header: "Date", width: 14 },
  { key: "screenshots", header: "Screenshots", width: 14 },
  { key: "extractions", header: "Extractions", width: 14 },
  { key: "creditsUsed", header: "Credits", width: 12 },
];

export function registerUsageCommand(parent: Command): void {
  parent
    .command("usage")
    .description("Show extraction usage statistics")
    .option("--start <date>", "Period start (ISO date)")
    .option("--end <date>", "Period end (ISO date)")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts<{ start?: string; end?: string }>();
        const client = createClient(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        const usage = await client.extraction.getUsage({
          ...(opts.start && { periodStart: opts.start }),
          ...(opts.end && { periodEnd: opts.end }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        });

        printOutput(usage, globalOpts);
      }),
    );

  parent
    .command("usage-daily")
    .description("Show daily usage breakdown")
    .option("--start <date>", "Period start (ISO date)")
    .option("--end <date>", "Period end (ISO date)")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts<{ start?: string; end?: string }>();
        const client = createClient(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        const { days } = await client.extraction.getUsageDaily({
          ...(opts.start && { periodStart: opts.start }),
          ...(opts.end && { periodEnd: opts.end }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        });

        if (globalOpts.json) {
          printOutput({ days }, globalOpts);
          return;
        }

        printOutput(days, globalOpts, dailyColumns);
      }),
    );
}
