import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, type Column } from "../../output.js";

const timeSeriesColumns: Column[] = [
  { key: "date", header: "Date", width: 14 },
  { key: "sent", header: "Sent", width: 8 },
  { key: "delivered", header: "Delivered", width: 11 },
  { key: "opened", header: "Opened", width: 9 },
  { key: "clicked", header: "Clicked", width: 9 },
  { key: "bounced", header: "Bounced", width: 9 },
  { key: "failed", header: "Failed", width: 8 },
];

const hourlyColumns: Column[] = [
  { key: "hour", header: "Hour", width: 8 },
  { key: "sent", header: "Sent", width: 8 },
  { key: "delivered", header: "Delivered", width: 11 },
  { key: "opened", header: "Opened", width: 9 },
  { key: "clicked", header: "Clicked", width: 9 },
];

export function registerAnalyticsCommand(mail: Command): void {
  mail
    .command("analytics")
    .description("Get email analytics")
    .option("--days <n>", "Number of days for time series", parseInt)
    .option("--hourly", "Show hourly analytics")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        if (opts.hourly) {
          const result = await client.mail.getHourlyAnalytics();
          printOutput(result.data, globalOpts, hourlyColumns);
          return;
        }

        if (opts.days) {
          const result = await client.mail.getTimeSeriesAnalytics({ days: opts.days });
          printOutput(result.data, globalOpts, timeSeriesColumns);
          return;
        }

        const result = await client.mail.getAnalytics();
        printOutput(result, globalOpts);
      })
    );
}
