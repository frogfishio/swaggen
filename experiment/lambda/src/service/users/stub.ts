
  // Auto-generated stub class for UsersStub
  import { GetUserResponse, PostUserResponse } from "./proxy";

import { UsersProxy } from "./proxy";
import { User } from "../schema/user";
  
  // Query parameter interfaces
  interface GetUserQueryParams { limit?: number; status?: string; createdBefore?: string; metadata?: object }
  
  export class UsersStub implements UsersProxy {
    
    async readUsers(query: GetUserQueryParams): Promise<GetUserResponse> {
      return Promise.reject("Not implemented");
    }

    async createUsers(data: User): Promise<PostUserResponse> {
      return Promise.reject("Not implemented");
    }
  }
      