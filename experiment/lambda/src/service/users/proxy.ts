
  // Auto-generated proxy for UsersProxy
  
  import { User } from "../schema/user";
  
  // Auto-generated interfaces
  export type GetUserResponse = User[];

export type PostUserRequest = User;

export type PostUserResponse = User;
  
  // Query parameter interfaces
  interface GetUserQueryParams { limit?: number; status?: string; createdBefore?: string; metadata?: object }
  
  export interface UsersProxy {
    readUsers(query: GetUserQueryParams): Promise<GetUserResponse>;
createUsers(data: User): Promise<PostUserResponse>;
  }
    