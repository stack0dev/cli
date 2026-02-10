import { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { printOutput, printSuccess, formatDate, type Column } from "../../../output.js";

const DOCUMENT_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "title", header: "Title" },
  { key: "type", header: "Type" },
  { key: "isArchived", header: "Archived", format: (v) => (v ? "Yes" : "No") },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

const TABLE_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "description", header: "Description" },
  { key: "isArchived", header: "Archived", format: (v) => (v ? "Yes" : "No") },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

const TABLE_ROW_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "tableId", header: "Table ID" },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

function requireConnectionId(cmd: Command): string {
  const localOpts = cmd.opts<{ connectionId?: string }>();
  if (!localOpts.connectionId) {
    throw new Error("--connection-id is required.");
  }
  return localOpts.connectionId;
}

function registerDocumentsCommand(productivity: Command): void {
  const documents = new Command("documents").description("Manage productivity documents");
  documents.requiredOption("--connection-id <id>", "Connection ID");

  documents
    .command("list")
    .description("List documents")
    .option("--parent-id <id>", "Filter by parent document ID")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ parentId?: string; limit?: string }>();

        const result = await client.integrations.productivity.listDocuments(
          connectionId,
          localOpts.parentId,
          { limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined },
        );

        printOutput(result.data, opts, DOCUMENT_COLUMNS);
      }),
    );

  documents
    .command("get <id>")
    .description("Get a document by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        const doc = await client.integrations.productivity.getDocument(connectionId, id);
        printOutput(doc, opts);
      }),
    );

  documents
    .command("create")
    .description("Create a new document")
    .requiredOption("--title <title>", "Document title")
    .option("--content <content>", "Document content")
    .option("--type <type>", "Document type (page, document, note)")
    .option("--parent-id <id>", "Parent document ID")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{
          title: string;
          content?: string;
          type?: string;
          parentId?: string;
        }>();

        const doc = await client.integrations.productivity.createDocument(connectionId, {
          title: localOpts.title,
          content: localOpts.content,
          type: localOpts.type as "page" | "document" | "note" | undefined,
          parentId: localOpts.parentId,
        });

        printSuccess("Document created.");
        printOutput(doc, opts);
      }),
    );

  documents
    .command("update <id>")
    .description("Update a document")
    .option("--title <title>", "Document title")
    .option("--content <content>", "Document content")
    .option("--type <type>", "Document type (page, document, note)")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{
          title?: string;
          content?: string;
          type?: string;
        }>();

        const doc = await client.integrations.productivity.updateDocument(connectionId, id, {
          title: localOpts.title,
          content: localOpts.content,
          type: localOpts.type as "page" | "document" | "note" | undefined,
        });

        printSuccess("Document updated.");
        printOutput(doc, opts);
      }),
    );

  productivity.addCommand(documents);
}

function registerTablesCommand(productivity: Command): void {
  const tables = new Command("tables").description("Manage productivity tables");
  tables.requiredOption("--connection-id <id>", "Connection ID");

  tables
    .command("list")
    .description("List tables")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const localOpts = cmd.opts<{ limit?: string }>();

        const result = await client.integrations.productivity.listTables(connectionId, {
          limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined,
        });

        printOutput(result.data, opts, TABLE_COLUMNS);
      }),
    );

  tables
    .command("get <id>")
    .description("Get a table by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);

        const table = await client.integrations.productivity.getTable(connectionId, id);
        printOutput(table, opts);
      }),
    );

  productivity.addCommand(tables);
}

function registerTableRowsCommand(productivity: Command): void {
  const tableRows = new Command("table-rows").description("Manage table rows");
  tableRows.requiredOption("--connection-id <id>", "Connection ID");
  tableRows.requiredOption("--table-id <id>", "Table ID");

  tableRows
    .command("list")
    .description("List table rows")
    .option("--limit <n>", "Maximum number of results")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const parentOpts = cmd.parent!.opts<{ tableId: string }>();
        const localOpts = cmd.opts<{ limit?: string }>();

        const result = await client.integrations.productivity.listTableRows(
          connectionId,
          parentOpts.tableId,
          { limit: localOpts.limit ? parseInt(localOpts.limit, 10) : undefined },
        );

        printOutput(result.data, opts, TABLE_ROW_COLUMNS);
      }),
    );

  tableRows
    .command("get <row-id>")
    .description("Get a table row by ID")
    .action(
      withErrorHandler(async (rowId: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const parentOpts = cmd.parent!.opts<{ tableId: string }>();

        const row = await client.integrations.productivity.getTableRow(
          connectionId,
          parentOpts.tableId,
          rowId,
        );

        printOutput(row, opts);
      }),
    );

  tableRows
    .command("create")
    .description("Create a new table row")
    .requiredOption("--data <json>", "Row data as JSON")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const parentOpts = cmd.parent!.opts<{ tableId: string }>();
        const localOpts = cmd.opts<{ data: string }>();

        let cells: Record<string, unknown>;
        try {
          cells = JSON.parse(localOpts.data);
        } catch {
          throw new Error("Invalid JSON for --data. Provide a valid JSON object.");
        }

        const row = await client.integrations.productivity.createTableRow(
          connectionId,
          parentOpts.tableId,
          { cells },
        );

        printSuccess("Table row created.");
        printOutput(row, opts);
      }),
    );

  tableRows
    .command("update <row-id>")
    .description("Update a table row")
    .requiredOption("--data <json>", "Row data as JSON")
    .action(
      withErrorHandler(async (rowId: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const parentOpts = cmd.parent!.opts<{ tableId: string }>();
        const localOpts = cmd.opts<{ data: string }>();

        let cells: Record<string, unknown>;
        try {
          cells = JSON.parse(localOpts.data);
        } catch {
          throw new Error("Invalid JSON for --data. Provide a valid JSON object.");
        }

        const row = await client.integrations.productivity.updateTableRow(
          connectionId,
          parentOpts.tableId,
          rowId,
          { cells },
        );

        printSuccess("Table row updated.");
        printOutput(row, opts);
      }),
    );

  tableRows
    .command("delete <row-id>")
    .description("Delete a table row")
    .action(
      withErrorHandler(async (rowId: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const connectionId = requireConnectionId(cmd.parent!);
        const parentOpts = cmd.parent!.opts<{ tableId: string }>();

        await client.integrations.productivity.deleteTableRow(
          connectionId,
          parentOpts.tableId,
          rowId,
        );

        printSuccess(`Table row ${rowId} deleted.`);
      }),
    );

  productivity.addCommand(tableRows);
}

export function registerProductivityCommand(parent: Command): void {
  const productivity = new Command("productivity").description("Productivity integration commands");

  registerDocumentsCommand(productivity);
  registerTablesCommand(productivity);
  registerTableRowsCommand(productivity);

  parent.addCommand(productivity);
}
