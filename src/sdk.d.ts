declare module "@stack0/sdk" {
  export default class Stack0 {
    constructor(config: { apiKey: string; baseUrl?: string; cdnUrl?: string });
    mail: any;
    cdn: any;
    screenshots: any;
    extraction: any;
    integrations: any;
    marketing: any;
    workflows: any;
  }
}
