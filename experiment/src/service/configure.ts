import { Express } from "express";
import { UsersAdapter } from "./adapters/users";
import { UsersUseridAdapter } from "./adapters/users_userid";

/**
 * Configure routes for the Express app.
 * @param app - The Express app instance
 */
export function configureRoutes(app: Express): void {
  // Register routes for each adapter
  
  const users = new UsersAdapter();
  app.get("/users", users.get.bind(users));
  app.post("/users", users.post.bind(users));


  const usersUserid = new UsersUseridAdapter();
  app.get("/users/:userId", usersUserid.get.bind(usersUserid));

}
