import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject, resolveEnvironment } from "../../../config.js";
import { printOutput, printSuccess, formatDate, type Column } from "../../../output.js";

const runColumns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "workflowId", header: "Workflow", width: 28 },
  { key: "status", header: "Status", width: 12 },
  { key: "startedAt", header: "Started", width: 22, format: (v) => formatDate(v as string) },
  { key: "totalDurationMs", header: "Duration", width: 12, format: (v) => (v ? `${v}ms` : "-") },
];

export function registerRunsCommand(parent: Command): void {
  const runs = parent.command("runs").description("Manage workflow runs");

  runs
    .command("list")
    .description("List workflow runs")
    .option("--workflow-id <id>", "Filter by workflow ID")
    .option("--status <status>", "Filter by status (pending, running, completed, failed, cancelled)")
    .option("--limit <n>", "Maximum number of results", parseInt)
    .option("--cursor <cursor>", "Pagination cursor")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);
        const projectSlug = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts) as "sandbox" | "production" | undefined;

        const result = await client.workflows.listRuns({
          ...(opts.workflowId && { workflowId: opts.workflowId }),
          ...(opts.status && { status: opts.status }),
          ...(opts.limit && { limit: opts.limit }),
          ...(opts.cursor && { cursor: opts.cursor }),
          ...(projectSlug && { projectSlug }),
          ...(environment && { environment }),
        });

        printOutput(result.items, globalOpts, runColumns);
      })
    );

  runs
    .command("get <id>")
    .description("Get a workflow run by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);
        const projectSlug = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts) as "sandbox" | "production" | undefined;

        const run = await client.workflows.getRun({
          id,
          ...(projectSlug && { projectSlug }),
          ...(environment && { environment }),
        });

        printOutput(run, globalOpts);
      })
    );

  runs
    .command("cancel <id>")
    .description("Cancel a running workflow")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);
        const projectSlug = resolveProject(globalOpts);

        await client.workflows.cancelRun({
          id,
          ...(projectSlug && { projectSlug }),
        });

        printSuccess(`Cancelled workflow run ${id}`);
      })
    );
}
