
// Auto-generated stub class for UsersExtendedStub
import { CreateExtendedResponse } from "./proxy";

import { UsersExtendedProxy } from "./proxy";
import { User } from "../schema/user";
  
// Query parameter interfaces
interface PostExtendedRequestBody { source?: string; isActive?: boolean; user?: User; }
  
export class UsersExtendedStub implements UsersExtendedProxy {
  
    async createUsersExtended(data: PostExtendedRequestBody): Promise<CreateExtendedResponse> {
      return Promise.reject("Not implemented");
    }
}
