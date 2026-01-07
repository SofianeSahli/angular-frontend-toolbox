import { FileModel } from "./File.model";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  title?: string | null;
  description?: string | null;
  files?: FileModel[];
  auth_id: string;
  sentFriendRequests?: Friend[];
  receivedFriendRequests?: Friend[];
  friends?: User[]; 
}

export interface Friend {
  user_uuid: string;   
  friend_uuid: string; 
  status?: 'pending' | 'accepted' | 'blocked' | 'denied';
  user?: Partial<User>;
  friend?: Partial<User>;
}