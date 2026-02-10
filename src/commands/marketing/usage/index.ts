import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject, resolveEnvironment } from "../../../config.js";
import { printOutput, formatDate, type Column } from "../../../output.js";

const USAGE_HISTORY_COLUMNS: Column[] = [
  { key: "periodStart", header: "Period Start", format: (v) => formatDate(v as string) },
  { key: "periodEnd", header: "Period End", format: (v) => formatDate(v as string) },
  { key: "contentGenerated", header: "Content" },
  { key: "aiScriptsGenerated", header: "Scripts" },
  { key: "aiTokensUsed", header: "Tokens" },
  { key: "creditsUsed", header: "Credits" },
];

function resolveRequired(opts: ReturnType<typeof getGlobalOptions>) {
  const projectSlug = resolveProject(opts);
  if (!projectSlug) {
    throw new Error("Project is required. Use --project or set a default with `stack0 config set project <slug>`.");
  }
  const environment = (resolveEnvironment(opts) || "production");
  return { projectSlug, environment };
}

export function registerUsageCommand(marketing: Command): void {
  const usage = marketing.command("usage").description("View marketing usage and credits");

  usage
    .command("current")
    .description("Get current period usage")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);

        const result = await client.marketing.getCurrentUsage({
          projectSlug,
          environment,
        });

        printOutput(result, opts);
      }),
    );

  usage
    .command("history")
    .description("Get usage history")
    .option("--limit <n>", "Number of periods to return", "12")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();

        const items = await client.marketing.getUsageHistory({
          projectSlug,
          environment,
          limit: parseInt(localOpts.limit, 10),
        });

        printOutput(items, opts, USAGE_HISTORY_COLUMNS);
      }),
    );

  usage
    .command("total")
    .description("Get total usage across all periods")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);

        const result = await client.marketing.getTotalUsage({
          projectSlug,
          environment,
        });

        printOutput(result, opts);
      }),
    );
}
