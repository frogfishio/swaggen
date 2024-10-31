// Base imports
import { BaseHandler, Request, Response } from "./handler.base";

// Proxy import
import { UsersExtendedProxy } from "./proxy";

// Stub import
import { UsersExtendedStub } from "./stub";

// Type imports from proxy
import { CreateUsersExtendedResponse } from "./proxy";

// Auto-generated by Handler Generator
// Handler class for UsersExtended

export class UsersExtendedHandler extends BaseHandler {

	private proxy: UsersExtendedProxy = new UsersExtendedStub();

  public async createUsersExtended(req: Request): Promise<Response> {
    // Proxy method signature: createUsersExtended(request: void): Promise<CreateUsersExtendedResponse>;
    const result = await this.proxy.createUsersExtended();
    // TODO: Implement POST logic
    return new Response(200, { "Content-Type": "application/json" }, { message: "POST method called" });
  }

  protected postBadRequest(): Response {
    return super.badRequest("Bad Request - Invalid input");
  }

  protected postUnauthorized(): Response {
    return super.unauthorized("Unauthorized - Missing or invalid authentication token");
  }

  protected postForbidden(): Response {
    return super.forbidden("Forbidden - You do not have permission to access this resource");
  }

  protected postInternalServerError(): Response {
    return super.internalServerError("Internal Server Error");
  }

}
