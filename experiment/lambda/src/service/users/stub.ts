
// Auto-generated stub class for UsersStub
import { GetUserResponse, PostUserRequest, PostUserResponse } from "./proxy";
import { UsersProxy } from "./proxy";
import { User } from "../schema/user";

export class UsersStub implements UsersProxy {
  
  async readUsers(request: void): Promise<GetUserResponse> {
    return Promise.reject("Not implemented");
  }

  async createUsers(request: PostUserRequest): Promise<PostUserResponse> {
    return Promise.reject("Not implemented");
  }
}
    