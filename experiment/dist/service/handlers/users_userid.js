"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersUseridHandler = void 0;
const _1 = require("./_");
class UsersUseridHandler extends _1.BaseHandler {
    getBadRequest() {
        return super.badRequest("Bad Request - Invalid user ID format");
    }
    getUnauthorized() {
        return super.unauthorized("Unauthorized - Missing or invalid authentication token");
    }
    getForbidden() {
        return super.forbidden("Forbidden - You do not have permission to access this resource");
    }
    getNotFound() {
        return super.notFound("User not found");
    }
    getInternalServerError() {
        return super.internalServerError("Internal Server Error");
    }
    get(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.path.split("/").pop() || ""; // Fallback to empty string if undefined
            if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId)) {
                return this.badRequest("Invalid UUID format for userId");
            }
            // TODO: Implement GET logic
            // If request body type is needed: (req.body as any)
            return new _1.Response(200, { "Content-Type": "application/json" }, { message: "GET method called" });
        });
    }
}
exports.UsersUseridHandler = UsersUseridHandler;
