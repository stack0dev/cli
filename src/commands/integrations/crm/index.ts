import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { printOutput, printSuccess, formatDate, type Column } from "../../../output.js";

const CONTACT_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "firstName", header: "First Name" },
  { key: "lastName", header: "Last Name" },
  { key: "email", header: "Email" },
  { key: "companyName", header: "Company" },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

const COMPANY_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "domain", header: "Domain" },
  { key: "industry", header: "Industry" },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

const DEAL_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "amount", header: "Amount" },
  { key: "stage", header: "Stage" },
  { key: "status", header: "Status" },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

function requireConnectionId(cmd: Command): string {
  const localOpts = cmd.opts<{ connectionId?: string }>();
  if (!localOpts.connectionId) {
    throw new Error("--connection-id is required.");
  }
  return localOpts.connectionId;
}

function registerContactsCommand(crm: Command): void {
  const contacts = new Command("contacts").description("Manage CRM contacts");
  contacts.requiredOption("--connection-id <id>", "Connection ID");

  contacts
    .command("list")
    .description("List contacts")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ limit?: string }>();

        const result = await client.integrations.crm.listContacts(connectionId, {
          limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined,
        });

        printOutput(result.data, opts, CONTACT_COLUMNS);
      }),
    );

  contacts
    .command("get <id>")
    .description("Get a contact by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        const contact = await client.integrations.crm.getContact(connectionId, id);
        printOutput(contact, opts);
      }),
    );

  contacts
    .command("create")
    .description("Create a new contact")
    .option("--email <email>", "Contact email")
    .option("--first-name <name>", "First name")
    .option("--last-name <name>", "Last name")
    .option("--phone <phone>", "Phone number")
    .option("--title <title>", "Job title")
    .option("--company-id <id>", "Company ID")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{
          email?: string;
          firstName?: string;
          lastName?: string;
          phone?: string;
          title?: string;
          companyId?: string;
        }>();

        const contact = await client.integrations.crm.createContact(connectionId, {
          email: localOpts.email,
          firstName: localOpts.firstName,
          lastName: localOpts.lastName,
          phone: localOpts.phone,
          title: localOpts.title,
          companyId: localOpts.companyId,
        });

        printSuccess("Contact created.");
        printOutput(contact, opts);
      }),
    );

  contacts
    .command("update <id>")
    .description("Update a contact")
    .option("--email <email>", "Contact email")
    .option("--first-name <name>", "First name")
    .option("--last-name <name>", "Last name")
    .option("--phone <phone>", "Phone number")
    .option("--title <title>", "Job title")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{
          email?: string;
          firstName?: string;
          lastName?: string;
          phone?: string;
          title?: string;
        }>();

        const contact = await client.integrations.crm.updateContact(connectionId, id, {
          email: localOpts.email,
          firstName: localOpts.firstName,
          lastName: localOpts.lastName,
          phone: localOpts.phone,
          title: localOpts.title,
        });

        printSuccess("Contact updated.");
        printOutput(contact, opts);
      }),
    );

  contacts
    .command("delete <id>")
    .description("Delete a contact")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        await client.integrations.crm.deleteContact(connectionId, id);
        printSuccess(`Contact ${id} deleted.`);
      }),
    );

  crm.addCommand(contacts);
}

function registerCompaniesCommand(crm: Command): void {
  const companies = new Command("companies").description("Manage CRM companies");
  companies.requiredOption("--connection-id <id>", "Connection ID");

  companies
    .command("list")
    .description("List companies")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ limit?: string }>();

        const result = await client.integrations.crm.listCompanies(connectionId, {
          limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined,
        });

        printOutput(result.data, opts, COMPANY_COLUMNS);
      }),
    );

  companies
    .command("get <id>")
    .description("Get a company by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        const company = await client.integrations.crm.getCompany(connectionId, id);
        printOutput(company, opts);
      }),
    );

  companies
    .command("create")
    .description("Create a new company")
    .requiredOption("--name <name>", "Company name")
    .option("--domain <domain>", "Company domain")
    .option("--industry <industry>", "Industry")
    .option("--website <url>", "Website URL")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{
          name: string;
          domain?: string;
          industry?: string;
          website?: string;
        }>();

        const company = await client.integrations.crm.createCompany(connectionId, {
          name: localOpts.name,
          domain: localOpts.domain,
          industry: localOpts.industry,
          website: localOpts.website,
        });

        printSuccess("Company created.");
        printOutput(company, opts);
      }),
    );

  companies
    .command("update <id>")
    .description("Update a company")
    .option("--name <name>", "Company name")
    .option("--domain <domain>", "Company domain")
    .option("--industry <industry>", "Industry")
    .option("--website <url>", "Website URL")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{
          name?: string;
          domain?: string;
          industry?: string;
          website?: string;
        }>();

        const company = await client.integrations.crm.updateCompany(connectionId, id, {
          name: localOpts.name,
          domain: localOpts.domain,
          industry: localOpts.industry,
          website: localOpts.website,
        });

        printSuccess("Company updated.");
        printOutput(company, opts);
      }),
    );

  companies
    .command("delete <id>")
    .description("Delete a company")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        await client.integrations.crm.deleteCompany(connectionId, id);
        printSuccess(`Company ${id} deleted.`);
      }),
    );

  crm.addCommand(companies);
}

function registerDealsCommand(crm: Command): void {
  const deals = new Command("deals").description("Manage CRM deals");
  deals.requiredOption("--connection-id <id>", "Connection ID");

  deals
    .command("list")
    .description("List deals")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ limit?: string }>();

        const result = await client.integrations.crm.listDeals(connectionId, {
          limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined,
        });

        printOutput(result.data, opts, DEAL_COLUMNS);
      }),
    );

  deals
    .command("get <id>")
    .description("Get a deal by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        const deal = await client.integrations.crm.getDeal(connectionId, id);
        printOutput(deal, opts);
      }),
    );

  deals
    .command("create")
    .description("Create a new deal")
    .requiredOption("--name <name>", "Deal name")
    .option("--amount <amount>", "Deal amount")
    .option("--stage <stage>", "Deal stage")
    .option("--status <status>", "Deal status (open, won, lost)")
    .option("--company-id <id>", "Company ID")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{
          name: string;
          amount?: string;
          stage?: string;
          status?: string;
          companyId?: string;
        }>();

        const deal = await client.integrations.crm.createDeal(connectionId, {
          name: localOpts.name,
          amount: localOpts.amount ? parseFloat(localOpts.amount) : undefined,
          stage: localOpts.stage,
          status: localOpts.status as "open" | "won" | "lost" | undefined,
          companyId: localOpts.companyId,
        });

        printSuccess("Deal created.");
        printOutput(deal, opts);
      }),
    );

  deals
    .command("update <id>")
    .description("Update a deal")
    .option("--name <name>", "Deal name")
    .option("--amount <amount>", "Deal amount")
    .option("--stage <stage>", "Deal stage")
    .option("--status <status>", "Deal status (open, won, lost)")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{
          name?: string;
          amount?: string;
          stage?: string;
          status?: string;
        }>();

        const deal = await client.integrations.crm.updateDeal(connectionId, id, {
          name: localOpts.name,
          amount: localOpts.amount ? parseFloat(localOpts.amount) : undefined,
          stage: localOpts.stage,
          status: localOpts.status as "open" | "won" | "lost" | undefined,
        });

        printSuccess("Deal updated.");
        printOutput(deal, opts);
      }),
    );

  deals
    .command("delete <id>")
    .description("Delete a deal")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        await client.integrations.crm.deleteDeal(connectionId, id);
        printSuccess(`Deal ${id} deleted.`);
      }),
    );

  crm.addCommand(deals);
}

export function registerCrmCommand(parent: Command): void {
  const crm = new Command("crm").description("CRM integration commands");

  registerContactsCommand(crm);
  registerCompaniesCommand(crm);
  registerDealsCommand(crm);

  parent.addCommand(crm);
}
