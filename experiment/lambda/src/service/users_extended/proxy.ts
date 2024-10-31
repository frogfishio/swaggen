
// Auto-generated proxy for UsersExtendedProxy
  
import { User } from "../schema/user";
  
// Auto-generated interfaces
export interface CreateExtendedRequest {
  source?: string;
  isActive?: boolean;
  user?: User;
}

export interface CreateExtendedResponse {
  user?: User;
  source?: string;
  isActive?: boolean;
}
  
// Query parameter interfaces
interface PostExtendedRequestBody { source?: string; isActive?: boolean; user?: User; }
  
export interface UsersExtendedProxy {
	createUsersExtended(data: PostExtendedRequestBody): Promise<CreateExtendedResponse>;
}
