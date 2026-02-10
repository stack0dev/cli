import { Command } from "commander";
import chalk from "chalk";
import open from "open";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import { createSpinner } from "../../spinner.js";
import {
  setConfigValue,
  getConfigValue,
  resolveApiKey,
  resolveProject,
  resolveEnvironment,
  getConfigPath,
  clearConfig,
} from "../../config.js";
import { printSuccess, printInfo, printOutput } from "../../output.js";

const DEFAULT_BASE_URL = "https://app.stack0.dev";

function getAuthBaseUrl(opts: { baseUrl?: string }): string {
  return opts.baseUrl || getConfigValue("baseUrl") || DEFAULT_BASE_URL;
}

export function registerAuthCommand(parent: Command): void {
  const auth = new Command("auth").description("Manage authentication");

  auth
    .command("login")
    .description("Authenticate with Stack0")
    .option("--api-key <key>", "Provide an API key directly instead of using device flow")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const localOpts = command.opts() as { apiKey?: string };

        // Direct API key flow
        if (localOpts.apiKey) {
          setConfigValue("apiKey", localOpts.apiKey);
          printSuccess("API key saved successfully.");
          return;
        }

        const baseUrl = getAuthBaseUrl(globalOpts);

        // Device authorization flow
        const authorizeRes = await fetch(`${baseUrl}/api/auth/device/authorize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!authorizeRes.ok) {
          throw new Error(`Failed to initiate device authorization: ${authorizeRes.statusText}`);
        }

        const { deviceCode, userCode, verificationUri } = (await authorizeRes.json()) as {
          deviceCode: string;
          userCode: string;
          verificationUri: string;
        };

        console.log();
        console.log(chalk.bold("  Open the following URL in your browser:"));
        console.log(`  ${chalk.cyan(verificationUri)}`);
        console.log();
        console.log(chalk.bold("  Enter this code:"));
        console.log(`  ${chalk.yellow.bold(userCode)}`);
        console.log();

        // Try to open the browser automatically
        try {
          await open(verificationUri);
          printInfo("Browser opened automatically.");
        } catch {
          // Browser open is best-effort
        }

        // Poll for token
        const spinner = createSpinner("Waiting for authorization...");
        spinner.start();

        const POLL_INTERVAL = 5000;
        const MAX_ATTEMPTS = 60; // 5 minutes

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

          const tokenRes = await fetch(`${baseUrl}/api/auth/device/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceCode }),
          });

          if (tokenRes.ok) {
            const { token } = (await tokenRes.json()) as { token: string };
            setConfigValue("apiKey", token);
            spinner.succeed("Authenticated successfully!");
            return;
          }

          const body = (await tokenRes.json()) as { error?: string };

          if (body.error === "authorization_pending") {
            continue;
          }

          if (body.error === "slow_down") {
            // Back off slightly
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
            continue;
          }

          if (body.error === "expired_token") {
            spinner.fail("Device code expired. Please try again.");
            process.exit(1);
          }

          if (body.error === "access_denied") {
            spinner.fail("Authorization denied.");
            process.exit(1);
          }

          // Unknown error
          spinner.fail(`Authorization failed: ${body.error || tokenRes.statusText}`);
          process.exit(1);
        }

        spinner.fail("Authorization timed out. Please try again.");
        process.exit(1);
      })
    );

  auth
    .command("logout")
    .description("Log out and clear stored credentials")
    .action(
      withErrorHandler(async (_opts: unknown, _cmd: unknown) => {
        clearConfig();
        printSuccess("Logged out. All stored credentials have been cleared.");
      })
    );

  auth
    .command("whoami")
    .description("Show the current authenticated identity")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);

        const apiKey = resolveApiKey(globalOpts);
        if (!apiKey) {
          console.log(chalk.yellow("Not authenticated. Run `stack0 auth login` to sign in."));
          return;
        }

        const masked = apiKey.length > 8 ? `${apiKey.slice(0, 8)}..${apiKey.slice(-4)}` : "****";
        const project = resolveProject(globalOpts) || chalk.dim("not set");
        const env = resolveEnvironment(globalOpts) || chalk.dim("not set");

        if (globalOpts.json) {
          printOutput(
            {
              apiKey: masked,
              project: resolveProject(globalOpts) || null,
              environment: resolveEnvironment(globalOpts) || null,
            },
            globalOpts
          );
          return;
        }

        console.log();
        console.log(chalk.bold("  Authenticated Identity"));
        console.log(`  API Key:      ${masked}`);
        console.log(`  Project:      ${project}`);
        console.log(`  Environment:  ${env}`);
        console.log();
      })
    );

  auth
    .command("status")
    .description("Show current authentication and configuration status")
    .action(
      withErrorHandler(async (_opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);

        const apiKey = resolveApiKey(globalOpts);
        const project = resolveProject(globalOpts);
        const env = resolveEnvironment(globalOpts);
        const configPath = getConfigPath();
        const loggedIn = !!apiKey;

        if (globalOpts.json) {
          printOutput(
            {
              authenticated: loggedIn,
              project: project || null,
              environment: env || null,
              configPath,
            },
            globalOpts
          );
          return;
        }

        console.log();
        console.log(chalk.bold("  Auth Status"));
        console.log(
          `  Status:       ${loggedIn ? chalk.green("Authenticated") : chalk.red("Not authenticated")}`
        );
        console.log(`  Project:      ${project || chalk.dim("not set")}`);
        console.log(`  Environment:  ${env || chalk.dim("not set")}`);
        console.log(`  Config file:  ${chalk.dim(configPath)}`);
        console.log();
      })
    );

  parent.addCommand(auth);
}
