import { LambdaCloudWatchFactory } from "./cloudwatch";

export class LambdaCapabilityFactory {
  // Create capabilities for AWS
  public async createCapabilities(
    caps: Array<string>
  ): Promise<{ [key: string]: any }> {
    const capabilities: { [key: string]: any } = {};

    // Iterate through each capability in the array
    for (const cap of caps) {
      switch (cap) {
        case "log":
          // Initialize CloudWatch logger capability
          const logGroupName =
            process.env.LOG_GROUP_NAME || "/aws/lambda/your-log-group";
          const logStreamName = `${new Date().toISOString()}/your-lambda-stream`;

          const cloudwatchFactory = new LambdaCloudWatchFactory(
            logGroupName,
            logStreamName
          );
          capabilities.logger = await cloudwatchFactory.createLogger();
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
