// Auto-generated proxy for UsersProxy
import { GetUserResponse, PostUserRequest, PostUserResponse } from "./handler";
import { User } from "../schema/user";

export interface UsersProxy {
  readUsers(request: void): Promise<GetUserResponse>;
  createUsers(request: PostUserRequest): Promise<PostUserResponse>;
}
