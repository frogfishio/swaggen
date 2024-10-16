// Auto-generated by Invoker Generator
// Cloudflare Worker for UsersUseridHandler

import { UsersUseridHandler } from "../handlers/users_userid";
import { Request as InternalRequest, Response as InternalResponse } from "../handlers/_";
// Import any necessary capability factories for Cloudflare Workers
// import { CloudflareCapabilityFactory } from "@frogfish/swaggen-cloudflare"; // Uncomment if such a factory exists

let handlerInstance: Promise<UsersUseridHandler> | null = null;

// Function to initialize the handler
function initializeHandler(): Promise<UsersUseridHandler> {
  if (!handlerInstance) {
    handlerInstance = (async () => {
      // Initialize capabilities (if any) for Cloudflare Workers
      // Uncomment and adjust the following lines if you have a CloudflareCapabilityFactory
      // const cfFactory = new CloudflareCapabilityFactory();
      // const capabilities = await cfFactory.createCapabilities(["log"]);
      
      const capabilities = {}; // Replace with actual capability initialization if needed
      return new UsersUseridHandler(capabilities);
    })();
  }
  return handlerInstance;
}

// List of supported HTTP methods for this endpoint
const supportedMethods = [
  'get'
];

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
  try {
    const handler = await initializeHandler();

    // Extract HTTP method and normalize it to lowercase
    const methodName = request.method.toLowerCase();

    // Check if the method is supported
    if (!supportedMethods.includes(methodName)) {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
    }

    // Parse request body if necessary
    let body: any = undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else {
        body = await request.text();
      }
    }

    // Create an instance of your custom Request class
    const internalReq = new InternalRequest(
      request.method,
      Object.fromEntries(request.headers.entries()),
      body,
      new URL(request.url).pathname
    );

    // Invoke the corresponding method on the handler instance
    const handlerResponse: InternalResponse = await handler[methodName](internalReq);

    // Return the response
    return new Response(JSON.stringify(handlerResponse.body), {
      status: handlerResponse.statusCode,
      headers: handlerResponse.headers,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}