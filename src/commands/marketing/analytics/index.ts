import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject, resolveEnvironment } from "../../../config.js";
import { printOutput, type Column } from "../../../output.js";

const PERFORMANCE_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "title", header: "Title" },
  { key: "contentType", header: "Type" },
  { key: "views", header: "Views", format: (v) => String(v ?? 0) },
  { key: "likes", header: "Likes", format: (v) => String(v ?? 0) },
  { key: "shares", header: "Shares", format: (v) => String(v ?? 0) },
  { key: "engagementRate", header: "Eng. Rate", format: (v) => `${Number(v ?? 0).toFixed(2)}%` },
];

function resolveRequired(opts: ReturnType<typeof getGlobalOptions>) {
  const projectSlug = resolveProject(opts);
  if (!projectSlug) {
    throw new Error("Project is required. Use --project or set a default with `stack0 config set project <slug>`.");
  }
  const environment = (resolveEnvironment(opts) || "production");
  return { projectSlug, environment };
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function registerAnalyticsCommand(marketing: Command): void {
  const analytics = marketing.command("analytics").description("View marketing analytics and performance");

  analytics
    .command("overview")
    .description("Get analytics overview")
    .option("--days <n>", "Number of days to look back", "30")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();
        const days = parseInt(localOpts.days, 10);

        const result = await client.marketing.getAnalyticsOverview({
          projectSlug,
          environment,
          startDate: daysAgo(days),
          endDate: new Date(),
        });

        printOutput(result, opts);
      }),
    );

  analytics
    .command("performance")
    .description("Get content performance metrics")
    .option("--type <type>", "Filter by content type")
    .option("--limit <n>", "Maximum number of results", "20")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();

        const items = await client.marketing.getContentPerformance({
          projectSlug,
          environment,
          contentType: localOpts.type,
          limit: parseInt(localOpts.limit, 10),
        });

        printOutput(items, opts, PERFORMANCE_COLUMNS);
      }),
    );

  analytics
    .command("trends")
    .description("Get trend discovery analytics")
    .option("--days <n>", "Number of days to look back", "30")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();
        const days = parseInt(localOpts.days, 10);

        const result = await client.marketing.getTrendAnalytics({
          projectSlug,
          environment,
          startDate: daysAgo(days),
          endDate: new Date(),
        });

        printOutput(result, opts);
      }),
    );

  analytics
    .command("conversion")
    .description("Get opportunity conversion analytics")
    .option("--days <n>", "Number of days to look back", "30")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();
        const days = parseInt(localOpts.days, 10);

        const result = await client.marketing.getOpportunityConversion({
          projectSlug,
          environment,
          startDate: daysAgo(days),
          endDate: new Date(),
        });

        printOutput(result, opts);
      }),
    );
}
