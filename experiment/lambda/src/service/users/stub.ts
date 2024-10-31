
// Auto-generated stub class for UsersStub
    import { CreateUsersResponse, ReadUsersResponse } from "./proxy";

import { UsersProxy } from "./proxy";
import { User } from "../schema/user";
  
// Query parameter interfaces
    interface GetReadUsersQueryParams { limit?: number; status?: string; createdBefore?: string; metadata?: object }
  
export class UsersStub implements UsersProxy {
  
    async readUsers(query: GetReadUsersQueryParams): Promise<ReadUsersResponse> {
      return Promise.reject("Not implemented");
    }

    async createUsers(data: User): Promise<CreateUsersResponse> {
      return Promise.reject("Not implemented");
    }
}
