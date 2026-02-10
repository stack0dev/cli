import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { printOutput, printSuccess, type Column, formatDate } from "../../../output.js";

const columns: Column[] = [
  { key: "id", header: "ID", width: 28 },
  { key: "domain", header: "Domain", width: 30 },
  { key: "status", header: "Status", width: 12 },
  { key: "isDefault", header: "Default", width: 9, format: (v) => (v ? "Yes" : "No") },
  { key: "createdAt", header: "Created", width: 22, format: (v) => formatDate(v as string) },
];

export function registerDomainsCommand(mail: Command): void {
  const domains = new Command("domains").description("Manage sending domains");

  domains
    .command("list")
    .description("List domains")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.domains.list({
          projectSlug: globalOpts.project ?? "",
        });

        printOutput(result, globalOpts, columns);
      })
    );

  domains
    .command("add")
    .description("Add a domain")
    .requiredOption("--domain <domain>", "Domain name")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const opts = command.opts();
        const client = createClient(globalOpts);

        const result = await client.mail.domains.add({ domain: opts.domain });

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Domain "${opts.domain}" added. Configure your DNS records below:`);
          printOutput(result.dnsRecords, globalOpts);
        }
      })
    );

  domains
    .command("verify")
    .description("Verify a domain")
    .argument("<id>", "Domain ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.domains.verify(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          if (result.verified) {
            printSuccess("Domain verified.");
          } else {
            console.log(result.message);
          }
        }
      })
    );

  domains
    .command("records")
    .description("Get DNS records for a domain")
    .argument("<id>", "Domain ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.domains.getDnsRecords(id as string);
        printOutput(result, globalOpts);
      })
    );

  domains
    .command("delete")
    .description("Delete a domain")
    .argument("<id>", "Domain ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.domains.delete(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess("Domain deleted.");
        }
      })
    );

  domains
    .command("set-default")
    .description("Set a domain as the default")
    .argument("<id>", "Domain ID")
    .action(
      withErrorHandler(async (id: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const client = createClient(globalOpts);

        const result = await client.mail.domains.setDefault(id as string);

        if (globalOpts.json) {
          printOutput(result, globalOpts);
        } else {
          printSuccess(`Domain "${result.domain}" set as default.`);
        }
      })
    );

  mail.addCommand(domains);
}
