import { BaseUser } from './baseuser';
import { Profile } from './profile';
import { Address } from './address';
export interface User extends BaseUser {
  profile?: Profile;
  addresses?: Address[];
  role?: 'admin' | 'user' | 'guest';
}
