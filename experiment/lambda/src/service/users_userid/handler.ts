// Base imports
import { BaseHandler, Request, Response } from "./handler.base";

// Proxy import
import { UsersUserIdProxy } from "./proxy";

// Stub import
import { UsersUserIdStub } from "./stub";

// Type imports from proxy
import { ReadUsersUserIdQueryParams, ReadUsersUserIdResponse } from "./proxy";

// Auto-generated by Handler Generator
// Handler class for UsersUserId

export class UsersUserIdHandler extends BaseHandler {

	private proxy: UsersUserIdProxy = new UsersUserIdStub();

  public async readUsersUserId(req: Request): Promise<Response> {
    // Proxy method signature: readUsersUserId(request: ReadUsersUserIdQueryParams): Promise<ReadUsersUserIdResponse>;
    const userId = req.path.split("/").pop() || ""; // Fallback to empty string if undefined
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId)) {
      return this.badRequest("Invalid UUID format for userId");
    }
    const userId = req.path.split("/").pop() || "";
    const result = await this.proxy.readUsersUserId(userId, req.query);
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
