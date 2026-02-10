import { readFileSync } from "node:fs";
import { basename } from "node:path";
import type { Command } from "commander";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createClient } from "../../client.js";
import { resolveProject } from "../../config.js";
import { printOutput, printSuccess } from "../../output.js";
import { withSpinner } from "../../spinner.js";
import { lookup } from "../../mime.js";

export function registerUploadCommand(cdn: Command): void {
  cdn
    .command("upload <file>")
    .description("Upload a file to CDN")
    .option("--folder <folder>", "Target folder path")
    .action(
      withErrorHandler(async (file: string, _opts: unknown, cmd: Command) => {
        const opts = getGlobalOptions(cmd);
        const client = createClient(opts);
        const projectSlug = resolveProject(opts);

        if (!projectSlug) {
          throw new Error("Project is required. Use --project or set a default with `stack0 config set project <slug>`.");
        }

        const localOpts = cmd.opts();
        const fileBuffer = readFileSync(file);
        const fileName = basename(file);
        const mimeType = lookup(fileName) || "application/octet-stream";

        const asset = await withSpinner("Uploading file...", async (spinner) => {
          const result = await client.cdn.upload({
            projectSlug,
            file: fileBuffer,
            filename: fileName,
            mimeType,
            folder: localOpts.folder,
          });
          spinner.text = "Upload complete";
          return result;
        });

        printSuccess(`Uploaded ${fileName}`);
        printOutput(asset, opts);
      }),
    );
}
