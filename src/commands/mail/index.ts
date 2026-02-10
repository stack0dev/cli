import { Command } from "commander";
import { registerSendCommand } from "./send.js";
import { registerListCommand } from "./list.js";
import { registerGetCommand } from "./get.js";
import { registerResendCommand } from "./resend.js";
import { registerCancelCommand } from "./cancel.js";
import { registerAnalyticsCommand } from "./analytics.js";
import { registerDomainsCommand } from "./domains/index.js";
import { registerTemplatesCommand } from "./templates/index.js";
import { registerContactsCommand } from "./contacts/index.js";
import { registerAudiencesCommand } from "./audiences/index.js";
import { registerCampaignsCommand } from "./campaigns/index.js";
import { registerSequencesCommand } from "./sequences/index.js";
import { registerEventsCommand } from "./events/index.js";

export function registerMailCommand(parent: Command): void {
  const mail = new Command("mail").description("Email sending, templates, campaigns, and more");

  registerSendCommand(mail);
  registerListCommand(mail);
  registerGetCommand(mail);
  registerResendCommand(mail);
  registerCancelCommand(mail);
  registerAnalyticsCommand(mail);
  registerDomainsCommand(mail);
  registerTemplatesCommand(mail);
  registerContactsCommand(mail);
  registerAudiencesCommand(mail);
  registerCampaignsCommand(mail);
  registerSequencesCommand(mail);
  registerEventsCommand(mail);

  parent.addCommand(mail);
}
