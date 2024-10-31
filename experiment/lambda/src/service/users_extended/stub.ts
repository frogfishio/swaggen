
// Auto-generated stub class for UsersExtendedStub
    import { CreateUsersExtendedResponse } from "./proxy";

import { UsersExtendedProxy } from "./proxy";
import { User } from "../schema/user";
  
// Query parameter interfaces
    interface PostCreateUsersExtendedRequestBody { source?: string; isActive?: boolean; user?: User; }
  
export class UsersExtendedStub implements UsersExtendedProxy {
  
    async createUsersExtended(data: PostCreateUsersExtendedRequestBody): Promise<CreateUsersExtendedResponse> {
      return Promise.reject("Not implemented");
    }
}
