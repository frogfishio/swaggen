
    // Auto-generated proxy for _users_{userId}Proxy
    import { User } from "../schema/user";

    export class _users_{userId}Proxy {
      constructor(private handler: _users_{userId}Handler) {}

      
        public async get(request: get/users/{userId}Request): Promise<get/users/{userId}Response> {
          return this.handler.get(request);
        }
        
    }
    