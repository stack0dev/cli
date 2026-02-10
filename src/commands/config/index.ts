import { Command } from "commander";
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { withErrorHandler, getGlobalOptions } from "../../errors.js";
import {
  setConfigValue,
  getConfigValue,
  clearConfig,
  getConfigPath,
} from "../../config.js";
import { printSuccess, printOutput } from "../../output.js";

const VALID_KEYS = ["apiKey", "defaultProject", "defaultEnvironment", "baseUrl"] as const;
type ConfigKey = (typeof VALID_KEYS)[number];

function isValidKey(key: string): key is ConfigKey {
  return (VALID_KEYS as readonly string[]).includes(key);
}

export function registerConfigCommand(parent: Command): void {
  const config = new Command("config").description("Manage CLI configuration");

  config
    .command("set")
    .description("Set a configuration value")
    .argument("<key>", `Config key (${VALID_KEYS.join(", ")})`)
    .argument("<value>", "Config value")
    .action(
      withErrorHandler(async (key: unknown, value: unknown, _opts: unknown, _cmd: unknown) => {
        const k = key as string;
        const v = value as string;

        if (!isValidKey(k)) {
          throw new Error(
            `Invalid config key: "${k}". Valid keys: ${VALID_KEYS.join(", ")}`
          );
        }

        setConfigValue(k, v);
        printSuccess(`Set ${k} = ${k === "apiKey" ? "****" : v}`);
      })
    );

  config
    .command("get")
    .description("Get a configuration value, or all values if no key specified")
    .argument("[key]", "Config key to retrieve")
    .action(
      withErrorHandler(async (key: unknown, _opts: unknown, cmd: unknown) => {
        const command = cmd as Command;
        const globalOpts = getGlobalOptions(command);
        const k = key as string | undefined;

        if (k) {
          if (!isValidKey(k)) {
            throw new Error(
              `Invalid config key: "${k}". Valid keys: ${VALID_KEYS.join(", ")}`
            );
          }

          const value = getConfigValue(k);

          if (globalOpts.json) {
            printOutput({ [k]: value ?? null }, globalOpts);
            return;
          }

          if (value === undefined) {
            console.log(chalk.dim(`${k} is not set`));
          } else {
            console.log(`${chalk.bold(k)} = ${k === "apiKey" ? "****" : value}`);
          }
          return;
        }

        // Show all config values
        const allValues: Record<string, string | null> = {};
        for (const validKey of VALID_KEYS) {
          allValues[validKey] = getConfigValue(validKey) ?? null;
        }

        if (globalOpts.json) {
          printOutput(allValues, globalOpts);
          return;
        }

        console.log();
        console.log(chalk.bold("  Configuration"));
        for (const [configKey, configValue] of Object.entries(allValues)) {
          const display =
            configValue === null
              ? chalk.dim("not set")
              : configKey === "apiKey"
                ? "****"
                : configValue;
          console.log(`  ${chalk.bold(configKey)}: ${display}`);
        }
        console.log(`  ${chalk.dim(`Config file: ${getConfigPath()}`)}`);
        console.log();
      })
    );

  config
    .command("reset")
    .description("Clear all configuration")
    .action(
      withErrorHandler(async (_opts: unknown, _cmd: unknown) => {
        const confirmed = await confirm({
          message: "Are you sure you want to reset all configuration?",
          default: false,
        });

        if (!confirmed) {
          console.log("Reset cancelled.");
          return;
        }

        clearConfig();
        printSuccess("Configuration has been reset.");
      })
    );

  parent.addCommand(config);
}
