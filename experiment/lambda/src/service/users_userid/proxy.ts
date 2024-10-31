
// Auto-generated proxy for UsersUserIdProxy
  
import { User } from "../schema/user";
  
// Auto-generated interfaces
export type ReadUserResponse = User;
  
// Query parameter interfaces
interface ReadUserQueryParams { include?: string[] }
  
export interface UsersUserIdProxy {
	readUsersByUserId(userId: string, query: ReadUserQueryParams): Promise<ReadUserResponse>;
}
