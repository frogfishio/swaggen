
// Auto-generated stub class for UsersStub
import { GetUserResponse, PostUserRequest, PostUserResponse } from "./handler";
import { UsersProxy } from "./proxy";
import { User } from "../schema/user";

export class UsersStub implements UsersProxy {
  
  async readUser(request: void): Promise<GetUserResponse> {
    return Promise.reject("Not implemented");
  }

  async createUser(request: PostUserRequest): Promise<PostUserResponse> {
    return Promise.reject("Not implemented");
  }
}
    