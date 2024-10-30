
  // Auto-generated proxy for UsersUseridProxy
  
  import { User } from "../schema/user";
  
  // Auto-generated interfaces
  export type GetUserResponse = User;
  
  // Query parameter interfaces
  interface GetUserQueryParams { include?: string[] }
  
  export interface UsersUseridProxy {
    readUsersByUserId(userId: string, query: GetUserQueryParams): Promise<GetUserResponse>;
  }
    