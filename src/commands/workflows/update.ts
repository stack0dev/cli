import { Command } from "commander";
import { readFileSync } from "fs";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { resolveProject } from "../../config.js";
import { printOutput, printSuccess } from "../../output.js";

export function registerUpdateCommand(parent: Command): void {
  parent
    .command("update <id>")
    .description("Update a workflow")
    .option("--name <name>", "Workflow name")
    .option("--description <desc>", "Workflow description")
    .option("--steps <json>", "Steps as JSON string or @file.json")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);
        const projectSlug = resolveProject(globalOpts);

        let steps: Record<string, unknown> | undefined;
        if (opts.steps) {
          let stepsRaw = opts.steps as string;
          if (stepsRaw.startsWith("@")) {
            stepsRaw = readFileSync(stepsRaw.slice(1), "utf-8");
          }
          steps = JSON.parse(stepsRaw);
        }

        const result = await client.workflows.update({
          id,
          ...(opts.name && { name: opts.name }),
          ...(opts.description && { description: opts.description }),
          ...(steps && { steps }),
          ...(projectSlug && { projectSlug }),
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Workflow ${id} updated (version: ${result.version})`);
          printOutput(result, globalOpts);
        }
      })
    );
}
