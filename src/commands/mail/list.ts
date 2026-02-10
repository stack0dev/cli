import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, type Column, formatDate, truncate } from "../../output.js";

const columns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "from", header: "From", width: 28 },
  { key: "to", header: "To", width: 28 },
  { key: "subject", header: "Subject", width: 30, format: (v) => truncate(String(v ?? ""), 28) },
  { key: "status", header: "Status", width: 12 },
  { key: "createdAt", header: "Created", width: 22, format: (v) => formatDate(v as string) },
];

export function registerListCommand(mail: Command): void {
  mail
    .command("list")
    .description("List emails")
    .option("--limit <n>", "Max results", parseInt)
    .option("--offset <n>", "Offset", parseInt)
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.list({
          limit: opts.limit,
          offset: opts.offset,
        });

        printOutput(result.emails, globalOpts, columns);
      })
    );
}
