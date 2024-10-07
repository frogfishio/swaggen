import { CloudWatchLogs } from "aws-sdk"; // Import AWS SDK for CloudWatch
import { Log } from "../capabilities";

export class LambdaCloudWatchFactory {
  private cloudwatchLogs = new CloudWatchLogs();
  private logGroupName: string;
  private logStreamName: string;
  private sequenceToken: string | undefined;

  constructor(logGroupName: string, logStreamName: string) {
    this.logGroupName = logGroupName;
    this.logStreamName = logStreamName;
  }

  // Initialize the CloudWatch logger object
  public async createLogger(): Promise<Log> {
    await this.ensureLogGroupAndStream();

    return {
      log: (message: string) => this.putLogEvent("INFO", message),
      error: (message: string) => this.putLogEvent("ERROR", message),
      warn: (message: string) => this.putLogEvent("WARN", message),
    };
  }

  // Helper function to send log events to CloudWatch
  private async putLogEvent(level: string, message: string) {
    const params = {
      logEvents: [
        {
          message: `[${level}] ${message}`,
          timestamp: Date.now(),
        },
      ],
      logGroupName: this.logGroupName,
      logStreamName: this.logStreamName,
      sequenceToken: this.sequenceToken,
    };

    try {
      const response = await this.cloudwatchLogs.putLogEvents(params).promise();
      this.sequenceToken = response.nextSequenceToken; // Update sequence token
    } catch (err) {
      console.error("Failed to send log to CloudWatch:", err);
    }
  }

  // Create or ensure the log group and stream exist
  private async ensureLogGroupAndStream() {
    try {
      // Create or ensure log group
      await this.cloudwatchLogs
        .createLogGroup({ logGroupName: this.logGroupName })
        .promise()
        .catch((err) => {
          if (err.code !== "ResourceAlreadyExistsException") throw err;
        });

      // Create or ensure log stream
      await this.cloudwatchLogs
        .createLogStream({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
        })
        .promise()
        .catch((err) => {
          if (err.code !== "ResourceAlreadyExistsException") throw err;
        });
    } catch (err) {
      console.error("Failed to ensure log group or stream:", err);
    }
  }
}
