import type { Command } from "commander";
import { registerTrendsCommand } from "./trends/index.js";
import { registerOpportunitiesCommand } from "./opportunities/index.js";
import { registerContentCommand } from "./content/index.js";
import { registerScriptsCommand } from "./scripts/index.js";
import { registerAnalyticsCommand } from "./analytics/index.js";
import { registerCalendarCommand } from "./calendar/index.js";
import { registerSettingsCommand } from "./settings/index.js";
import { registerUsageCommand } from "./usage/index.js";

export function registerMarketingCommand(parent: Command): void {
  const marketing = parent
    .command("marketing")
    .description("Discover trends, generate content, and manage marketing campaigns");

  registerTrendsCommand(marketing);
  registerOpportunitiesCommand(marketing);
  registerContentCommand(marketing);
  registerScriptsCommand(marketing);
  registerAnalyticsCommand(marketing);
  registerCalendarCommand(marketing);
  registerSettingsCommand(marketing);
  registerUsageCommand(marketing);
}
