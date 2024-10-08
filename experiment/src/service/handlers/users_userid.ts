import { User } from "../schema/user";
import { Error } from "../schema/error";
import { BaseHandler, Request, Response } from "./_";

export class UsersUseridHandler extends BaseHandler {

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
  public async get(req: Request): Promise<Response> {
    const userId = req.path.split("/").pop() || ""; // Fallback to empty string if undefined

    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId)) {
      return this.badRequest("Invalid UUID format for userId");
    }
    // TODO: Implement GET logic
    // If request body type is needed: (req.body as any)
    return new Response(200, { "Content-Type": "application/json" }, { message: "GET method called" });
  }

}
