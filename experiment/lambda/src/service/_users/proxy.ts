
    // Auto-generated proxy for _usersProxy
    import { User } from "../schema/user";

    export class _usersProxy {
      constructor(private handler: _usersHandler) {}

      
        public async get(request: get/usersRequest): Promise<get/usersResponse> {
          return this.handler.get(request);
        }
        

        public async post(request: post/usersRequest): Promise<post/usersResponse> {
          return this.handler.post(request);
        }
        
    }
    