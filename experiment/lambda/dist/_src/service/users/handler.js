var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Base imports
import { BaseHandler, Response } from "./handler.base";
// Auto-generated by Handler Generator
// Handler class for UsersHandler
export class UsersHandler extends BaseHandler {
    constructor() {
        super(...arguments);
        this.proxy = new Stub();
    }
    get(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.proxy.get();
            // TODO: Implement GET logic
            return new Response(200, { "Content-Type": "application/json" }, { message: "GET method called" });
        });
    }
    post(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.proxy.post();
            // TODO: Implement POST logic
            // If request body type is needed: (req.body as UserRequest)
            return new Response(200, { "Content-Type": "application/json" }, { message: "POST method called" });
        });
    }
    getUnauthorized() {
        return super.unauthorized("Unauthorized - Missing or invalid authentication token");
    }
    getForbidden() {
        return super.forbidden("Forbidden - You do not have permission to access this resource");
    }
    getInternalServerError() {
        return super.internalServerError("Internal Server Error");
    }
    postBadRequest() {
        return super.badRequest("Bad Request - Invalid user data");
    }
    postUnauthorized() {
        return super.unauthorized("Unauthorized - Missing or invalid authentication token");
    }
    postForbidden() {
        return super.forbidden("Forbidden - You do not have permission to access this resource");
    }
    postInternalServerError() {
        return super.internalServerError("Internal Server Error");
    }
}