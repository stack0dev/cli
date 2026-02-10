import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { printOutput, printSuccess, type Column, formatDate, truncate } from "../../../output.js";

const columns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "name", header: "Name", width: 22 },
  { key: "subject", header: "Subject", width: 26, format: (v) => truncate(String(v ?? ""), 24) },
  { key: "status", header: "Status", width: 12 },
  { key: "totalRecipients", header: "Recipients", width: 12 },
  { key: "sentCount", header: "Sent", width: 8 },
  { key: "createdAt", header: "Created", width: 22, format: (v) => formatDate(v as string) },
];

export function registerCampaignsCommand(mail: Command): void {
  const campaigns = new Command("campaigns").description("Manage email campaigns");

  campaigns
    .command("list")
    .description("List campaigns")
    .option("--limit <n>", "Max results", parseInt)
    .option("--offset <n>", "Offset", parseInt)
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.campaigns.list({
          limit: opts.limit,
          offset: opts.offset,
        });

        printOutput(result.campaigns, globalOpts, columns);
      })
    );

  campaigns
    .command("get")
    .description("Get a campaign by ID")
    .argument("<id>", "Campaign ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.campaigns.get(id as string);
        printOutput(result, globalOpts);
      })
    );

  campaigns
    .command("create")
    .description("Create a campaign")
    .requiredOption("--name <name>", "Campaign name")
    .requiredOption("--subject <subject>", "Email subject")
    .requiredOption("--from-email <email>", "Sender email")
    .option("--from-name <name>", "Sender name")
    .option("--html <html>", "HTML body (prefix with @ to read from file)")
    .option("--text <text>", "Plain text body")
    .option("--template-id <id>", "Template ID")
    .option("--audience-id <id>", "Audience ID")
    .option("--reply-to <email>", "Reply-to address")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        let html = opts.html as string | undefined;
        if (html?.startsWith("@")) {
          const { readFileSync } = await import("fs");
          html = readFileSync(html.slice(1), "utf-8");
        }

        const result = await client.mail.campaigns.create({
          name: opts.name,
          subject: opts.subject,
          fromEmail: opts.fromEmail,
          fromName: opts.fromName,
          html,
          text: opts.text,
          templateId: opts.templateId,
          audienceId: opts.audienceId,
          replyTo: opts.replyTo,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Campaign "${result.name}" created (ID: ${result.id})`);
        }
      })
    );

  campaigns
    .command("update")
    .description("Update a campaign")
    .argument("<id>", "Campaign ID")
    .option("--name <name>", "Campaign name")
    .option("--subject <subject>", "Email subject")
    .option("--from-email <email>", "Sender email")
    .option("--from-name <name>", "Sender name")
    .option("--html <html>", "HTML body")
    .option("--text <text>", "Plain text body")
    .option("--template-id <id>", "Template ID")
    .option("--audience-id <id>", "Audience ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.campaigns.update({
          id: id as string,
          name: opts.name,
          subject: opts.subject,
          fromEmail: opts.fromEmail,
          fromName: opts.fromName,
          html: opts.html,
          text: opts.text,
          templateId: opts.templateId,
          audienceId: opts.audienceId,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Campaign "${result.name}" updated.`);
        }
      })
    );

  campaigns
    .command("delete")
    .description("Delete a campaign")
    .argument("<id>", "Campaign ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.campaigns.delete(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Campaign deleted.");
        }
      })
    );

  campaigns
    .command("send")
    .description("Send a campaign")
    .argument("<id>", "Campaign ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.campaigns.send({ id: id as string, sendNow: true });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Campaign sending: ${result.sentCount}/${result.totalRecipients} sent`);
        }
      })
    );

  campaigns
    .command("pause")
    .description("Pause a sending campaign")
    .argument("<id>", "Campaign ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.campaigns.pause(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Campaign paused.");
        }
      })
    );

  campaigns
    .command("cancel")
    .description("Cancel a campaign")
    .argument("<id>", "Campaign ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.campaigns.cancel(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Campaign cancelled.");
        }
      })
    );

  campaigns
    .command("stats")
    .description("Get campaign statistics")
    .argument("<id>", "Campaign ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.campaigns.getStats(id as string);
        printOutput(result, globalOpts);
      })
    );

  mail.addCommand(campaigns);
}
