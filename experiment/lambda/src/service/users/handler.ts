// Base imports
import { BaseHandler, Request, Response } from "./handler.base";

// Auto-generated imports
import { User } from "../schema/user";

// Auto-generated interfaces
export type GetUserResponse = User[];

export type PostUserRequest = User;

export type PostUserResponse = User;

// Auto-generated by Handler Generator
// Handler class for UsersHandler

export class UsersHandler extends BaseHandler {

  public async get(req: Request): Promise<Response> {
    // TODO: Implement GET logic
    return new Response(200, { "Content-Type": "application/json" }, { message: "GET method called" });
  }

  public async post(req: Request): Promise<Response> {
    // TODO: Implement POST logic
    // If request body type is needed: (req.body as UserRequest)
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
