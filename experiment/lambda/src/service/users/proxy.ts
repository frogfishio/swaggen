
// Auto-generated proxy for UsersProxy
  
import { User } from "../schema/user";
  
// Auto-generated interfaces
export type ReadUserResponse = User[];

export type CreateUserRequest = User;

export type CreateUserResponse = User;
  
// Query parameter interfaces
interface ReadUserQueryParams { limit?: number; status?: string; createdBefore?: string; metadata?: object }
  
export interface UsersProxy {
	readUsers(query: ReadUserQueryParams): Promise<ReadUserResponse>;
	createUsers(data: User): Promise<CreateUserResponse>;
}
