
// Auto-generated proxy for UsersProxy
  
import { User } from "../schema/user";
  
// Auto-generated interfaces
export type ReadUsersResponse = User[];

export type CreateUsersRequest = User;

export type CreateUsersResponse = User;
  
// Query parameter interfaces
export interface ReadUsersQueryParams { limit?: number; status?: string; createdBefore?: string; metadata?: object }
  
export interface UsersProxy {
	readUsers(query: ReadUsersQueryParams): Promise<ReadUsersResponse>;
	createUsers(data: User): Promise<CreateUsersResponse>;
}
