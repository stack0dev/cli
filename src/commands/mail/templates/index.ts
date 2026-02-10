import { Command } from "commander";
import { readFileSync } from "fs";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { printOutput, printSuccess, type Column, formatDate, truncate } from "../../../output.js";

const columns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "name", header: "Name", width: 24 },
  { key: "slug", header: "Slug", width: 20 },
  { key: "subject", header: "Subject", width: 30, format: (v) => truncate(String(v ?? ""), 28) },
  { key: "isActive", header: "Active", width: 8, format: (v) => (v ? "Yes" : "No") },
  { key: "createdAt", header: "Created", width: 22, format: (v) => formatDate(v as string) },
];

export function registerTemplatesCommand(mail: Command): void {
  const templates = new Command("templates").description("Manage email templates");

  templates
    .command("list")
    .description("List templates")
    .option("--limit <n>", "Max results", parseInt)
    .option("--offset <n>", "Offset", parseInt)
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.templates.list({
          limit: opts.limit,
          offset: opts.offset,
        });

        printOutput(result.templates, globalOpts, columns);
      })
    );

  templates
    .command("get")
    .description("Get a template by ID")
    .argument("<id>", "Template ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.templates.get(id as string);
        printOutput(result, globalOpts);
      })
    );

  templates
    .command("create")
    .description("Create a template")
    .requiredOption("--name <name>", "Template name")
    .requiredOption("--subject <subject>", "Email subject")
    .requiredOption("--html <html>", "HTML body (prefix with @ to read from file)")
    .option("--slug <slug>", "Template slug")
    .option("--text <text>", "Plain text body")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        let html = opts.html as string;
        if (html.startsWith("@")) {
          html = readFileSync(html.slice(1), "utf-8");
        }

        const result = await client.mail.templates.create({
          name: opts.name,
          slug: opts.slug ?? opts.name.toLowerCase().replace(/\s+/g, "-"),
          subject: opts.subject,
          html,
          text: opts.text,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Template "${result.name}" created (ID: ${result.id})`);
        }
      })
    );

  templates
    .command("update")
    .description("Update a template")
    .argument("<id>", "Template ID")
    .option("--name <name>", "Template name")
    .option("--subject <subject>", "Email subject")
    .option("--html <html>", "HTML body (prefix with @ to read from file)")
    .option("--text <text>", "Plain text body")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        let html = opts.html as string | undefined;
        if (html?.startsWith("@")) {
          html = readFileSync(html.slice(1), "utf-8");
        }

        const result = await client.mail.templates.update({
          id: id as string,
          name: opts.name,
          subject: opts.subject,
          html,
          text: opts.text,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Template "${result.name}" updated.`);
        }
      })
    );

  templates
    .command("delete")
    .description("Delete a template")
    .argument("<id>", "Template ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.templates.delete(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Template deleted.");
        }
      })
    );

  templates
    .command("preview")
    .description("Preview a template with variables")
    .argument("<id>", "Template ID")
    .option("--vars <json>", "Template variables as JSON string", "{}")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.templates.preview({
          id: id as string,
          variables: JSON.parse(opts.vars),
        });

        printOutput(result, globalOpts);
      })
    );

  mail.addCommand(templates);
}
