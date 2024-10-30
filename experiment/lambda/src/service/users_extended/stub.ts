
  // Auto-generated stub class for UsersExtendedStub
  import { PostExtendedResponse } from "./proxy";

import { UsersExtendedProxy } from "./proxy";
import { User } from "../schema/user";
  
  // Query parameter interfaces
  interface PostExtendedRequestBody { source?: string; isActive?: boolean; user?: User; }
  
  export class UsersExtendedStub implements UsersExtendedProxy {
    
    async createExtended(data: PostExtendedRequestBody): Promise<PostExtendedResponse> {
      return Promise.reject("Not implemented");
    }
  }
      