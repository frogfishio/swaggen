import { Express } from "express";
import { UsersAdapter } from "./adapters/users";
import { UsersUserIdAdapter } from "./adapters/users_userid";

/**
 * Configure routes for the Express app.
 * @param app - The Express app instance
 */
export function configureRoutes(app: Express): void {
  // Register routes for each adapter
  
  const Users = new UsersAdapter();
  app.get("/users", Users.get.bind(Users));
  app.post("/users", Users.post.bind(Users));


  const UsersUserId = new UsersUserIdAdapter();
  app.get("/users/{userId}", UsersUserId.get.bind(UsersUserId));

}
