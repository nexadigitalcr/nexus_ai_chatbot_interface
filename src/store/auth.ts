import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      login: async (email: string, password: string) => {
        // This is a mock implementation. In a real app, you would call an API
        if (email === 'admin@nexusai.com' && password === 'admin123') {
          const user = {
            id: '1',
            name: 'Admin User',
            email: 'admin@nexusai.com',
            role: 'admin' as const
          };
          set({ user, isAuthenticated: true, isAdmin: true });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, isAdmin: false });
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);