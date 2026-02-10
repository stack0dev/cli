import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { resolveProject, resolveEnvironment } from "../../config.js";
import { printOutput, printSuccess } from "../../output.js";
import { withSpinner } from "../../spinner.js";

function collect(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

function parseVariables(vars: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const v of vars) {
    const eqIdx = v.indexOf("=");
    if (eqIdx === -1) {
      throw new Error(`Invalid variable format: "${v}". Expected key=value.`);
    }
    result[v.slice(0, eqIdx)] = v.slice(eqIdx + 1);
  }
  return result;
}

export function registerRunCommand(parent: Command): void {
  parent
    .command("run <slug>")
    .description("Run a workflow")
    .option("--var <key=value>", "Set a variable (repeatable)", collect, [])
    .option("--no-wait", "Return immediately with run ID instead of waiting")
    .action(
      withErrorHandler(async (slug: string, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts<{ var: string[]; wait: boolean }>();
        const client = createClient(globalOpts);
        const projectSlug = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts) as "sandbox" | "production" | undefined;

        const variables = opts.var.length > 0 ? parseVariables(opts.var) : undefined;

        const request = {
          workflowSlug: slug,
          ...(variables && { variables }),
          ...(projectSlug && { projectSlug }),
          ...(environment && { environment }),
        };

        if (!opts.wait) {
          const { id, status } = await client.workflows.run(request);
          printOutput({ id, status }, globalOpts);
          return;
        }

        const run = await withSpinner("Running workflow...", async () => {
          return client.workflows.runAndWait(request);
        });

        if (globalOpts.json) {
          printOutput(run, globalOpts);
        } else {
          printSuccess(`Workflow run completed (ID: ${run.id})`);
          printOutput(
            {
              id: run.id,
              status: run.status,
              totalSteps: run.totalSteps,
              completedSteps: run.completedSteps,
              totalDurationMs: run.totalDurationMs,
              creditsUsed: run.creditsUsed,
              output: run.output ? JSON.stringify(run.output) : null,
            },
            globalOpts,
          );
        }
      })
    );
}
