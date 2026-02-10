import { Command } from "commander";
import { readFileSync } from "fs";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { resolveProject, resolveEnvironment } from "../../config.js";
import { printOutput, printSuccess } from "../../output.js";

export function registerCreateCommand(parent: Command): void {
  parent
    .command("create")
    .description("Create a new workflow")
    .requiredOption("--name <name>", "Workflow name")
    .requiredOption("--slug <slug>", "Workflow slug")
    .requiredOption("--steps <json>", "Steps as JSON string or @file.json")
    .option("--description <desc>", "Workflow description")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);
        const projectSlug = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts) as "sandbox" | "production" | undefined;

        let stepsRaw = opts.steps as string;
        if (stepsRaw.startsWith("@")) {
          stepsRaw = readFileSync(stepsRaw.slice(1), "utf-8");
        }
        const steps = JSON.parse(stepsRaw);

        const result = await client.workflows.create({
          name: opts.name,
          slug: opts.slug,
          steps,
          ...(opts.description && { description: opts.description }),
          ...(projectSlug && { projectSlug }),
          ...(environment && { environment }),
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Workflow created (ID: ${result.id}, slug: ${result.slug})`);
          printOutput(result, globalOpts);
        }
      })
    );
}
