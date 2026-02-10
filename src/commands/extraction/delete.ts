import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printSuccess } from "../../output.js";
import { resolveProject, resolveEnvironment } from "../../config.js";

export function registerDeleteCommand(parent: Command): void {
  parent
    .command("delete")
    .description("Delete an extraction")
    .argument("<id>", "Extraction ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);
        const project = resolveProject(globalOpts);
        const environment = resolveEnvironment(globalOpts);

        await client.extraction.delete({
          id: id as string,
          ...(project && { projectId: project }),
          ...(environment && { environment: environment as "sandbox" | "production" }),
        });

        printSuccess(`Extraction ${id} deleted.`);
      }),
    );
}
