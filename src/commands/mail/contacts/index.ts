import { Command } from "commander";
import { readFileSync } from "fs";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { printOutput, printSuccess, type Column, formatDate } from "../../../output.js";

const columns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "email", header: "Email", width: 30 },
  { key: "firstName", header: "First Name", width: 16 },
  { key: "lastName", header: "Last Name", width: 16 },
  { key: "status", header: "Status", width: 14 },
  { key: "createdAt", header: "Created", width: 22, format: (v) => formatDate(v as string) },
];

export function registerContactsCommand(mail: Command): void {
  const contacts = new Command("contacts").description("Manage mail contacts");

  contacts
    .command("list")
    .description("List contacts")
    .option("--limit <n>", "Max results", parseInt)
    .option("--offset <n>", "Offset", parseInt)
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.contacts.list({
          limit: opts.limit,
          offset: opts.offset,
        });

        printOutput(result.contacts, globalOpts, columns);
      })
    );

  contacts
    .command("get")
    .description("Get a contact by ID")
    .argument("<id>", "Contact ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.contacts.get(id as string);
        printOutput(result, globalOpts);
      })
    );

  contacts
    .command("create")
    .description("Create a contact")
    .requiredOption("--email <email>", "Contact email")
    .option("--name <name>", "Contact name (first last)")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const nameParts = opts.name ? (opts.name as string).split(" ") : [];
        const result = await client.mail.contacts.create({
          email: opts.email,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" ") || undefined,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Contact "${result.email}" created (ID: ${result.id})`);
        }
      })
    );

  contacts
    .command("update")
    .description("Update a contact")
    .argument("<id>", "Contact ID")
    .option("--email <email>", "Contact email")
    .option("--name <name>", "Contact name (first last)")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const nameParts = opts.name ? (opts.name as string).split(" ") : [];
        const result = await client.mail.contacts.update({
          id: id as string,
          email: opts.email,
          firstName: nameParts[0],
          lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Contact "${result.email}" updated.`);
        }
      })
    );

  contacts
    .command("delete")
    .description("Delete a contact")
    .argument("<id>", "Contact ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.contacts.delete(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Contact deleted.");
        }
      })
    );

  contacts
    .command("import")
    .description("Import contacts from a JSON file")
    .requiredOption("--file <path>", "Path to JSON file with contacts array")
    .option("--audience-id <id>", "Audience to add contacts to")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const data = JSON.parse(readFileSync(opts.file, "utf-8"));
        const contacts = Array.isArray(data) ? data : data.contacts;

        const result = await client.mail.contacts.import({
          contacts,
          audienceId: opts.audienceId,
        });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Imported ${result.imported} contacts (${result.skipped} skipped)`);
          if (result.errors.length > 0) {
            console.log(`Errors: ${result.errors.length}`);
            for (const err of result.errors) {
              console.log(`  ${err.email}: ${err.error}`);
            }
          }
        }
      })
    );

  mail.addCommand(contacts);
}
