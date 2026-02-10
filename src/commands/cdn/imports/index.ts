import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../../errors.js";
import { createClient } from "../../../client.js";
import { resolveProject } from "../../../config.js";
import { printOutput, printSuccess, formatDate, type Column } from "../../../output.js";
import { withSpinner } from "../../../spinner.js";

const IMPORT_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "sourceBucket", header: "Bucket" },
  { key: "status", header: "Status" },
  { key: "processedFiles", header: "Processed" },
  { key: "totalFiles", header: "Total" },
  { key: "failedFiles", header: "Failed" },
  { key: "createdAt", header: "Created", format: (v) => formatDate(v as string) },
];

const IMPORT_FILE_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "sourceKey", header: "Source Key" },
  { key: "sourceSize", header: "Size", format: (v) => formatBytes(v as number) },
  { key: "status", header: "Status" },
  { key: "errorMessage", header: "Error" },
];

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function registerImportsCommand(cdn: Command): void {
  const imports = cdn.command("imports").description("Manage S3 import jobs");

  imports
    .command("create")
    .description("Create an S3 import job")
    .requiredOption("--bucket <bucket>", "Source S3 bucket name")
    .requiredOption("--region <region>", "Source bucket AWS region")
    .option("--prefix <prefix>", "Source prefix filter")
    .option("--auth-type <type>", "Auth type (iam_credentials or role_assumption)", "iam_credentials")
    .option("--access-key-id <key>", "AWS access key ID")
    .option("--secret-access-key <secret>", "AWS secret access key")
    .option("--role-arn <arn>", "IAM role ARN for role assumption")
    .option("--external-id <id>", "External ID for role assumption")
    .option("--path-mode <mode>", "Path mode (preserve or flatten)", "flatten")
    .option("--target-folder <folder>", "Target folder for imported assets")
    .option("--notify-email <email>", "Email for completion notification")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const result = await withSpinner("Creating import job...", async () => {
          return client.cdn.createImport({
            projectSlug,
            sourceBucket: localOpts.bucket,
            sourceRegion: localOpts.region,
            sourcePrefix: localOpts.prefix,
            authType: localOpts.authType,
            accessKeyId: localOpts.accessKeyId,
            secretAccessKey: localOpts.secretAccessKey,
            roleArn: localOpts.roleArn,
            externalId: localOpts.externalId,
            pathMode: localOpts.pathMode,
            targetFolder: localOpts.targetFolder,
            notifyEmail: localOpts.notifyEmail,
          });
        });

        printSuccess(`Import job created: ${result.importId}`);
        printOutput(result, opts);
      }),
    );

  imports
    .command("list")
    .description("List import jobs")
    .option("--status <status>", "Filter by status")
    .option("--limit <n>", "Maximum results", "20")
    .option("--offset <n>", "Offset for pagination", "0")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default.");
        }

        const localOpts = cmd.opts();
        const { imports: importList, total } = await client.cdn.listImports({
          projectSlug,
          status: localOpts.status,
          limit: parseInt(localOpts.limit, 10),
          offset: parseInt(localOpts.offset, 10),
        });

        if (opts.json) {
          printOutput({ imports: importList, total }, opts);
        } else {
          console.log(`Total: ${total}`);
          printOutput(importList, opts, IMPORT_COLUMNS);
        }
      }),
    );

  imports
    .command("get <id>")
    .description("Get an import job by ID")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const job = await client.cdn.getImport(id);

        if (!job) {
          throw new Error(`Import job ${id} not found`);
        }

        printOutput(job, opts);
      }),
    );

  imports
    .command("cancel <id>")
    .description("Cancel a running import job")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const result = await client.cdn.cancelImport(id);

        printSuccess(`Cancelled import job ${id}`);
        printOutput(result, opts);
      }),
    );

  imports
    .command("retry <id>")
    .description("Retry failed files in an import job")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const result = await client.cdn.retryImport(id);

        printSuccess(`Retrying ${result.retriedCount} failed files`);
        printOutput(result, opts);
      }),
    );

  imports
    .command("files <id>")
    .description("List files in an import job")
    .option("--status <status>", "Filter by status")
    .option("--limit <n>", "Maximum results", "50")
    .option("--offset <n>", "Offset for pagination", "0")
    .action(
      withErrorHandler(async (id: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const localOpts = cmd.opts();

        const { files, total } = await client.cdn.listImportFiles({
          importId: id,
          status: localOpts.status,
          limit: parseInt(localOpts.limit, 10),
          offset: parseInt(localOpts.offset, 10),
        });

        if (opts.json) {
          printOutput({ files, total }, opts);
        } else {
          console.log(`Total: ${total}`);
          printOutput(files, opts, IMPORT_FILE_COLUMNS);
        }
      }),
    );
}
