
// Auto-generated stub class for UsersUserIdStub
    import { ReadUsersByUserIdResponse } from "./proxy";

import { UsersUserIdProxy } from "./proxy";
import { User } from "../schema/user";
  
// Query parameter interfaces
    interface GetReadUsersByUserIdQueryParams { include?: string[] }
  
export class UsersUserIdStub implements UsersUserIdProxy {
  
    async readUsersByUserId(userId: string, query: GetReadUsersByUserIdQueryParams): Promise<ReadUsersByUserIdResponse> {
      return Promise.reject("Not implemented");
    }
}
