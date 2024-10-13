
    // Auto-generated proxy for _users_extendedProxy
    import { User } from "../schema/user";

    export class _users_extendedProxy {
      constructor(private handler: _users_extendedHandler) {}

      
        public async post(request: post/users/extendedRequest): Promise<post/users/extendedResponse> {
          return this.handler.post(request);
        }
        
    }
    