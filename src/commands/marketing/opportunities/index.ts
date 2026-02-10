import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject, resolveEnvironment } from "../../../config.js";
import { printOutput, printSuccess, formatDate, truncate, type Column } from "../../../output.js";

const OPPORTUNITY_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "title", header: "Title", format: (v) => truncate(String(v ?? ""), 40) },
  { key: "contentType", header: "Type" },
  { key: "opportunityScore", header: "Score" },
  { key: "status", header: "Status" },
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

export function registerOpportunitiesCommand(marketing: Command): void {
  const opportunities = marketing
    .command("opportunities")
    .description("Generate and manage content opportunities");

  opportunities
    .command("generate")
    .description("Generate content opportunities from active trends")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);

        const result = await client.marketing.generateOpportunities({ projectSlug, environment });

        if (opts.json) {
          printOutput(result, opts);
        } else {
          printSuccess(`Generated ${result.opportunitiesGenerated} opportunities`);
          printOutput(result.opportunities, opts, OPPORTUNITY_COLUMNS);
        }
      }),
    );

  opportunities
    .command("list")
    .description("List opportunities")
    .option("--limit <n>", "Maximum number of results", "20")
    .option("--offset <n>", "Offset for pagination", "0")
    .option("--status <status>", "Filter by status")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const { projectSlug, environment } = resolveRequired(opts);
        const localOpts = cmd.opts();

        const opportunities = await client.marketing.listOpportunities({
          projectSlug,
          environment,
          status: localOpts.status,
          limit: parseInt(localOpts.limit, 10),
        });

        printOutput(opportunities, opts, OPPORTUNITY_COLUMNS);
      }),
    );

  opportunities
    .command("get <id>")
    .description("Get an opportunity by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const opportunity = await client.marketing.getOpportunity(id);
        printOutput(opportunity, opts);
      }),
    );

  opportunities
    .command("dismiss <id>")
    .description("Dismiss an opportunity")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        await client.marketing.dismissOpportunity({ opportunityId: id });
        printSuccess(`Opportunity ${id} dismissed`);
      }),
    );
}
