import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput } from "../../output.js";
import { resolveProject, resolveEnvironment } from "../../config.js";

export function registerGetCommand(parent: Command): void {
  parent
    .command("get")
    .description("Get an extraction by ID")
    .argument("<id>", "Extraction ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);
        const project = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        const result = await client.extraction.get({
          id: id as string,
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        });

        printOutput(result, globalOpts);
      }),
    );
}
