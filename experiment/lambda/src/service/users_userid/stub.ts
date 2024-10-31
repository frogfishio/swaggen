
// Auto-generated stub class for UsersUserIdStub
import { ReadUserResponse } from "./proxy";

import { UsersUserIdProxy } from "./proxy";
import { User } from "../schema/user";
  
// Query parameter interfaces
interface GetUserQueryParams { include?: string[] }
  
export class UsersUserIdStub implements UsersUserIdProxy {
  
    async readUsersByUserId(userId: string, query: GetUserQueryParams): Promise<ReadUserResponse> {
      return Promise.reject("Not implemented");
    }
}
