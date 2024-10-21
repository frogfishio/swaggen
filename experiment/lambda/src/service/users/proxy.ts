
// Auto-generated proxy for UsersProxy

import { User } from "../schema/user";

// Auto-generated interfaces
export type GetUserResponse = User[];

export type PostUserRequest = User;

export type PostUserResponse = User;

export interface UsersProxy {
  readUsers(request: void): Promise<GetUserResponse>;
createUsers(request: PostUserRequest): Promise<PostUserResponse>;
}
    