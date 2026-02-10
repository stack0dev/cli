import { Command } from "commander";
import { readFileSync } from "fs";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { printOutput, printSuccess } from "../../output.js";

export function registerSendCommand(mail: Command): void {
  mail
    .command("send")
    .description("Send an email")
    .requiredOption("--from <address>", "Sender email address")
    .requiredOption("--to <address>", "Recipient email address")
    .requiredOption("--subject <subject>", "Email subject")
    .option("--html <html>", "HTML body (prefix with @ to read from file)")
    .option("--text <text>", "Plain text body")
    .option("--template-id <id>", "Template ID to use")
    .option("--vars <json>", "Template variables as JSON string")
    .option("--reply-to <address>", "Reply-to address")
    .option("--cc <address>", "CC address")
    .option("--bcc <address>", "BCC address")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        let html = opts.html as string | undefined;
        if (html?.startsWith("@")) {
          html = readFileSync(html.slice(1), "utf-8");
        }

        const result = await client.mail.send({
          from: opts.from,
          to: opts.to,
          subject: opts.subject,
          html,
          text: opts.text,
          templateId: opts.templateId,
          templateVariables: opts.vars ? JSON.parse(opts.vars) : undefined,
          replyTo: opts.replyTo,
          cc: opts.cc,
          bcc: opts.bcc,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Email sent (ID: ${result.id})`);
          printOutput(result, globalOpts);
        }
      })
    );
}
