
// Auto-generated proxy for UsersExtendedProxy
  
import { User } from "../schema/user";
  
// Auto-generated interfaces
export interface CreateUsersExtendedRequest {
  source?: string;
  isActive?: boolean;
  user?: User;
}

export interface CreateUsersExtendedResponse {
  user?: User;
  source?: string;
  isActive?: boolean;
}
  
// Query parameter interfaces
interface CreateUsersExtendedRequestBody { source?: string; isActive?: boolean; user?: User; }
  
export interface UsersExtendedProxy {
	createUsersExtended(data: CreateUsersExtendedRequestBody): Promise<CreateUsersExtendedResponse>;
}
