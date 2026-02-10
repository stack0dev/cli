import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject, resolveEnvironment } from "../../../config.js";
import { printOutput, printSuccess, formatDate, type Column } from "../../../output.js";

const TREND_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "keyword", header: "Keyword" },
  { key: "source", header: "Source" },
  { key: "trendScore", header: "Score" },
  { key: "status", header: "Status" },
  { key: "growthRate", header: "Growth %", format: (v) => (v != null ? `${v}%` : "-") },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

function resolveRequired(opts: ReturnType<typeof getGlobalOptions>) {
  const projectSlug = resolveProject(opts);
  if (!projectSlug) {
    throw new Error("Project is required. Use --project or set a default with `stack0 config set project <slug>`.");
  }
  const environment = (resolveEnvironment(opts) || "production");
  return { projectSlug, environment };
}

export function registerTrendsCommand(marketing: Command): void {
  const trends = marketing.command("trends").description("Discover and manage marketing trends");

  trends
    .command("discover")
    .description("Discover new trends from all sources")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);

        const result = await client.marketing.discoverTrends({ projectSlug, environment });

        if (opts.json) {
          printOutput(result, opts);
        } else {
          printSuccess(`Discovered ${result.trendsDiscovered} new trends`);
          printOutput(result.trends, opts, TREND_COLUMNS);
        }
      }),
    );

  trends
    .command("list")
    .description("List trends")
    .option("--limit <n>", "Maximum number of results", "20")
    .option("--status <status>", "Filter by status (discovered, analyzing, active, declining, expired)")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();

        const trends = await client.marketing.listTrends({
          projectSlug,
          environment,
          status: localOpts.status,
          limit: parseInt(localOpts.limit, 10),
        });

        printOutput(trends, opts, TREND_COLUMNS);
      }),
    );

  trends
    .command("get <id>")
    .description("Get a trend by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const trend = await client.marketing.getTrend(id);
        printOutput(trend, opts);
      }),
    );

  trends
    .command("update-status <id>")
    .description("Update a trend's status")
    .requiredOption("--status <status>", "New status (discovered, analyzing, active, declining, expired)")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        await client.marketing.updateTrendStatus({
          trendId: id,
          status: localOpts.status,
        });

        printSuccess(`Trend ${id} status updated to ${localOpts.status}`);
      }),
    );
}
