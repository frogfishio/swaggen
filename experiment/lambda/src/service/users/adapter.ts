// Auto-generated by Invoker Generator
// Lambda Handler for UsersHandler

import { UsersHandler } from "./handler";
import { SwaggenRequest, SwaggenResponse } from "./swaggen";
import { LambdaCapabilityFactory } from "@frogfish/swaggen-lambda"; // Import Lambda capability factory

let capabilitiesInstance: Promise<any> | null = null;
let handlerInstance: Promise<UsersHandler> | null = null;

// Function to initialize capabilities
async function initializeCapabilities(): Promise<any> {
  if (!capabilitiesInstance) {
    capabilitiesInstance = (async () => {
      // Get capabilities from the environment variable and parse it as a JSON array
      const capabilitiesEnv = process.env.CAPABILITIES || '[]';
      let capabilitiesArray: string[];

      try {
        capabilitiesArray = JSON.parse(capabilitiesEnv);
        if (!Array.isArray(capabilitiesArray)) {
          throw new Error('CAPABILITIES environment variable must be a JSON array');
        }
      } catch (error) {
        console.error("Error parsing CAPABILITIES environment variable:", error);
        capabilitiesArray = []; // Default to an empty array if parsing fails
      }

      // Initialize capabilities using the parsed array
      const awsFactory = new LambdaCapabilityFactory();
      return awsFactory.create(capabilitiesArray);
    })();
  }
  return capabilitiesInstance;
}

// Function to initialize the handler
function initializeHandler(): Promise<UsersHandler> {
  if (!handlerInstance) {
    handlerInstance = (async () => {
      const capabilities = await initializeCapabilities();
      return new UsersHandler(capabilities);
    })();
  }
  return handlerInstance;
}

// List of supported HTTP methods for this endpoint
const supportedMethods = [
  'get',

  'post'
];

// AWS Lambda handler function for the endpoint
export async function handler(event: any, context: any): Promise<any> {
  try {
    const handler = await initializeHandler();

    // Extract HTTP method and normalize it to lowercase
    const methodName = event.httpMethod.toLowerCase();

    // Check if the method is supported
    if (!supportedMethods.includes(methodName)) {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    // Create an instance of your custom Request class
    const internalReq = new SwaggenRequest(
      event.httpMethod,
      event.headers,
      event.body ? JSON.parse(event.body) : undefined,
      event.path
    );

    // Invoke the corresponding method on the handler instance
    // @ts-ignore indexing suppression as the workaround is not pragmatic
    const handlerResponse: SwaggenResponse = await handler[methodName](internalReq);

    // Return the response in AWS Lambda format
    return {
      statusCode: handlerResponse.statusCode,
      headers: handlerResponse.headers,
      body: JSON.stringify(handlerResponse.body),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}