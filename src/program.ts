import { Command } from "commander";
import { registerAuthCommand } from "./commands/auth/index.js";
import { registerConfigCommand } from "./commands/config/index.js";
import { registerMailCommand } from "./commands/mail/index.js";
import { registerCdnCommand } from "./commands/cdn/index.js";
import { registerScreenshotsCommand } from "./commands/screenshots/index.js";
import { registerExtractionCommand } from "./commands/extraction/index.js";
import { registerIntegrationsCommand } from "./commands/integrations/index.js";
import { registerMarketingCommand } from "./commands/marketing/index.js";
import { registerWorkflowsCommand } from "./commands/workflows/index.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("stack0")
    .description("Stack0 CLI — manage your Stack0 resources from the terminal")
    .version("0.1.0")
    .option("--api-key <key>", "API key for authentication")
    .option("-p, --project <project>", "Project ID")
    .option("-e, --env <environment>", "Environment (sandbox or production)")
    .option("--json", "Output as JSON")
    .option("--verbose", "Verbose output")
    .option("--no-color", "Disable colored output")
    .option("--base-url <url>", "Custom API base URL");

  registerAuthCommand(program);
  registerConfigCommand(program);
  registerMailCommand(program);
  registerCdnCommand(program);
  registerScreenshotsCommand(program);
  registerExtractionCommand(program);
  registerIntegrationsCommand(program);
  registerMarketingCommand(program);
  registerWorkflowsCommand(program);

  return program;
}
