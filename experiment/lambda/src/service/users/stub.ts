
// Auto-generated stub class for UsersStub
import { CreateUserResponse, ReadUserResponse } from "./proxy";

import { UsersProxy } from "./proxy";
import { User } from "../schema/user";
  
// Query parameter interfaces
interface GetUserQueryParams { limit?: number; status?: string; createdBefore?: string; metadata?: object }
  
export class UsersStub implements UsersProxy {
  
    async readUsers(query: GetUserQueryParams): Promise<ReadUserResponse> {
      return Promise.reject("Not implemented");
    }

    async createUsers(data: User): Promise<CreateUserResponse> {
      return Promise.reject("Not implemented");
    }
}
