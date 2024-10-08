// Auto-generated by Invoker Generator
// Adapter Class for UsersUseridHandler

import { UsersUseridHandler } from "../handlers/users_userid";
import { Request as CustomRequest, Response as CustomResponse } from "../handlers/_";
import { ExpressCapabilityFactory } from "../capabilities/express/capability"; // Import Express capability factory

export class UsersUseridAdapter {
  private handler!: UsersUseridHandler;

  constructor() {
    // Initialize capabilities
    this.initializeHandler();
  }

  // Method to initialize handler with Express capabilities
  private async initializeHandler() {
    const expressFactory = new ExpressCapabilityFactory();
    const capabilities = await expressFactory.createCapabilities(["log"]);

    // Pass the capabilities to the handler
    this.handler = new UsersUseridHandler(capabilities);
  }

  
  // Express route handler for GET requests
  public get(req: any, res: any): void {
    // Create an instance of your custom Request class
    const internalReq = new CustomRequest(
      req.method,
      req.headers,
      req.body,
      `${req.protocol}://${req.get('host')}${req.originalUrl}`
    );

    // Invoke the handler method and handle response
    this.handler.get(internalReq)
      .then((handlerResponse: CustomResponse) => {
        res.status(handlerResponse.statusCode)
           .set(handlerResponse.headers)
           .json(handlerResponse.body);
      })
      .catch((error: any) => {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error" });
      });
  }
  
}