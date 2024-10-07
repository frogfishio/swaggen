"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureRoutes = configureRoutes;
const users_1 = require("./adapters/users");
const users_userid_1 = require("./adapters/users_userid");
/**
 * Configure routes for the Express app.
 * @param app - The Express app instance
 */
function configureRoutes(app) {
    // Register routes for each adapter
    const users = new users_1.UsersAdapter();
    app.get("/users", users.get.bind(users));
    app.post("/users", users.post.bind(users));
    const usersUserid = new users_userid_1.UsersUseridAdapter();
    app.get("/users/:userId", usersUserid.get.bind(usersUserid));
}
