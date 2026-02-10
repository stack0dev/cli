import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, printSuccess } from "../../output.js";

export function registerCancelCommand(mail: Command): void {
  mail
    .command("cancel")
    .description("Cancel a scheduled email")
    .argument("<id>", "Email ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.cancel(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Email cancelled.");
        }
      })
    );
}
