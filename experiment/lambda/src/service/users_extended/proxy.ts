
// Auto-generated proxy for UsersExtendedProxy
import { PostExtendedRequest, PostExtendedResponse } from "./handler";
import { User } from "../schema/user";

export interface UsersExtendedProxy {
  createExtended(request: PostExtendedRequest): Promise<PostExtendedResponse>;
}
    