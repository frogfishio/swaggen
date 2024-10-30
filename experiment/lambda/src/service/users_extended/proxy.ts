
  // Auto-generated proxy for UsersExtendedProxy
  
  import { User } from "../schema/user";
  
  // Auto-generated interfaces
  export interface PostExtendedRequest {
  source?: string;
  isActive?: boolean;
  user?: User;
}

export interface PostExtendedResponse {
  user?: User;
  source?: string;
  isActive?: boolean;
}
  
  // Query parameter interfaces
  interface PostExtendedRequestBody { source?: string; isActive?: boolean; user?: User; }
  
  export interface UsersExtendedProxy {
    createExtended(data: PostExtendedRequestBody): Promise<PostExtendedResponse>;
  }
    