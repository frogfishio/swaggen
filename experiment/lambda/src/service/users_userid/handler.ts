// Base imports
import { BaseHandler, Request, Response } from "./handler.base";

// Proxy import
import { UsersUseridProxy } from "./proxy";

// Stub import
import { UsersUseridStub } from "./stub";

// Type imports from proxy
import { GetUsersUseridResponse } from "./proxy";

// Auto-generated by Handler Generator
// Handler class for UsersUserid

export class UsersUseridHandler extends BaseHandler {

	private proxy: UsersUseridProxy = new UsersUseridStub();

  public async get(req: Request): Promise<Response> {
    // Proxy method signature: readUsersUserid(request: void): Promise<GetUsersUseridResponse>;
    const userId = req.path.split("/").pop() || ""; // Fallback to empty string if undefined
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId)) {
      return this.badRequest("Invalid UUID format for userId");
    }
    const result = await this.proxy.readUsersUserid();
    // TODO: Implement GET logic
    return new Response(200, { "Content-Type": "application/json" }, { message: "GET method called" });
  }

  protected getBadRequest(): Response {
    return super.badRequest("Bad Request - Invalid user ID format");
  }

  protected getUnauthorized(): Response {
    return super.unauthorized("Unauthorized - Missing or invalid authentication token");
  }

  protected getForbidden(): Response {
    return super.forbidden("Forbidden - You do not have permission to access this resource");
  }

  protected getNotFound(): Response {
    return super.notFound("User not found");
  }

  protected getInternalServerError(): Response {
    return super.internalServerError("Internal Server Error");
  }

}
