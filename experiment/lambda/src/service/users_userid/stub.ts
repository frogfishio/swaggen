
  // Auto-generated stub class for UsersUseridStub
  import { GetUserResponse } from "./proxy";

import { UsersUseridProxy } from "./proxy";
import { User } from "../schema/user";
  
  // Query parameter interfaces
  interface GetUserQueryParams { include?: string[] }
  
  export class UsersUseridStub implements UsersUseridProxy {
    
    async readUsersByUserId(userId: string, query: GetUserQueryParams): Promise<GetUserResponse> {
      return Promise.reject("Not implemented");
    }
  }
      