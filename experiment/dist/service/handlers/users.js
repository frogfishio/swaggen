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
exports.UsersHandler = void 0;
const _1 = require("./_");
class UsersHandler extends _1.BaseHandler {
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
    get(req) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Implement GET logic
            // If request body type is needed: (req.body as any)
            return new _1.Response(200, { "Content-Type": "application/json" }, { message: "GET method called" });
        });
    }
    post(req) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Implement POST logic
            // If request body type is needed: (req.body as User)
            return new _1.Response(200, { "Content-Type": "application/json" }, { message: "POST method called" });
        });
    }
}
exports.UsersHandler = UsersHandler;
