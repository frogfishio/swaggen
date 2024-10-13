
// Auto-generated proxy for UsersProxy
import { GetUserResponse, PostUserRequest, PostUserResponse } from "./handler";
import { User } from "../schema/user";

export interface UsersProxy {
  readUser(request: void): Promise<GetUserResponse>;
createUser(request: PostUserRequest): Promise<PostUserResponse>;
}
    