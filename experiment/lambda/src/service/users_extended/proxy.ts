
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

export interface UsersExtendedProxy {
  createUsersExtended(request: PostExtendedRequest): Promise<PostExtendedResponse>;
}
    