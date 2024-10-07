import { ExpressLoggerFactory } from "./express-logger";

export class ExpressCapabilityFactory {
  // Create capabilities for Express
  public async createCapabilities(
    caps: Array<string>
  ): Promise<{ [key: string]: any }> {
    const capabilities: { [key: string]: any } = {};

    // Iterate through each capability in the array
    for (const cap of caps) {
      switch (cap) {
        case "log":
          // Initialize the logger using ExpressLoggerFactory
          const loggerFactory = new ExpressLoggerFactory();
          capabilities.logger = loggerFactory.createLogger();
          break;

        // Add additional cases for other capabilities here
        // case 'db':
        //   capabilities.db = await someDbFactory.createConnection();
        //   break;

        // Ignore unrecognized capabilities
        default:
          console.warn(`Unrecognized capability: ${cap}`);
          break;
      }
    }

    // Return only the recognized capabilities
    return capabilities;
  }
}
