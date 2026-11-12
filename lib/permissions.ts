/**
 * Re-exporting from real Supabase Auth in lib/auth.tsx
 * Preserving backwards compatibility for existing imports.
 */
export {
  AuthProvider,
  useAuth,
  checkExpensePermission,
  canResetSystemData,
} from './auth';

export type { AuthContextType } from './auth';

import { Role, UserProfile } from './types';

export const PRESET_USERS: Record<Role, UserProfile> = {
  admin: {
    id: 'usr-admin-1',
    name: 'Ryan Santos',
    email: 'lrvsantos@mymail.mapua.edu.ph',
    role: 'admin',
  },
  user: {
    id: 'usr-user-1',
    name: 'Standard User',
    email: 'user@tracker.local',
    role: 'user',
  },
  guest: {
    id: 'usr-guest-1',
    name: 'Guest Explorer',
    email: 'guest@tracker.local',
    role: 'guest',
  },
};

export const DEFAULT_USER = PRESET_USERS.admin;
export const SEED_OWNER_ID = PRESET_USERS.admin.id;
