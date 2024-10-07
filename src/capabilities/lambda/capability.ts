import { AWSCloudWatchFactory } from "./cloudwatch";

export class AWSCapabilityFactory {
  // Create capabilities for AWS
  public async createCapabilities(caps: Array<string>): Promise<{ [key: string]: any }> {
    // Initialize CloudWatch logger capability
    const logGroupName =
      process.env.LOG_GROUP_NAME || "/aws/lambda/your-log-group";
    const logStreamName = `${new Date().toISOString()}/your-lambda-stream`;

    const cloudwatchFactory = new AWSCloudWatchFactory(
      logGroupName,
      logStreamName
    );
    const logger = await cloudwatchFactory.createLogger();

    // Return capabilities object with logger
    return {
      logger,
    };
  }
}
