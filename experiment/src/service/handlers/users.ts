import { User } from "../schema/user";
import { Error } from "../schema/error";
import { BaseHandler, Request, Response } from "./_";

export class UsersHandler extends BaseHandler {

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
  public async get(req: Request): Promise<Response> {
    // TODO: Implement GET logic
    // If request body type is needed: (req.body as any)
    return new Response(200, { "Content-Type": "application/json" }, { message: "GET method called" });
  }

  public async post(req: Request): Promise<Response> {
    // TODO: Implement POST logic
    // If request body type is needed: (req.body as User)
    return new Response(200, { "Content-Type": "application/json" }, { message: "POST method called" });
  }

}
