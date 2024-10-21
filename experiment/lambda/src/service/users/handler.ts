// Base imports
import { BaseHandler, Request, Response } from "./handler.base";

// Schema imports
import { User } from "../schema/user";

// Proxy import
import { UsersProxy } from "./proxy";

// Stub import
import { UsersStub } from "./stub";

// Type imports from proxy
import { GetUserResponse, PostUserRequest, PostUserResponse } from "./proxy";

// Auto-generated by Handler Generator
// Handler class for Users

export class UsersHandler extends BaseHandler {

	private proxy: UsersProxy = new UsersStub();

  public async get(req: Request): Promise<Response> {
    // Proxy method signature: readUser(request: void): Promise<GetUserResponse>;
    const result = await this.proxy.readUsers();
    // TODO: Implement GET logic
    return new Response(200, { "Content-Type": "application/json" }, { message: "GET method called" });
  }

  public async post(req: Request): Promise<Response> {
    // Proxy method signature: createUser(request: PostUserRequest): Promise<PostUserResponse>;
    const result = await this.proxy.createUsers();
    // TODO: Implement POST logic
    // If request body type is needed: (req.body as User)
    return new Response(200, { "Content-Type": "application/json" }, { message: "POST method called" });
  }

  protected getUnauthorized(): Response {
    return super.unauthorized("Unauthorized - Missing or invalid authentication token");
  }

  protected getForbidden(): Response {
    return super.forbidden("Forbidden - You do not have permission to access this resource");
  }

  protected getInternalServerError(): Response {
    return super.internalServerError("Internal Server Error");
  }

  protected postBadRequest(): Response {
    return super.badRequest("Bad Request - Invalid user data");
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
