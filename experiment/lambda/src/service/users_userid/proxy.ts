
// Auto-generated proxy for UsersUserIdProxy
  
import { User } from "../schema/user";
  
// Auto-generated interfaces
export type ReadUsersByUserIdResponse = User;
  
// Query parameter interfaces
interface ReadUsersByUserIdQueryParams { include?: string[] }
  
export interface UsersUserIdProxy {
	readUsersByUserId(userId: string, query: ReadUsersByUserIdQueryParams): Promise<ReadUsersByUserIdResponse>;
}
