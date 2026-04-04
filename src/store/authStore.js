import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Dummy users for testing
const dummyUsers = [
  {
    id: '1',
    email: 'admin@healthcare.com',
    password: 'admin123',
    name: 'Dr. Sarah Johnson',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    phone: '+1 (555) 123-4567',
    address: '123 Medical Center Dr, New York, NY 10001',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'user@healthcare.com',
    password: 'user123',
    name: 'Northeast Lymphedema & Wound Care',
    companyName: 'Northeast Lymphedema & Wound Care',
    role: 'user',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=NL&backgroundColor=0ea5e9',
    phone: '(401) 555-0217',
    address: '88 University Ave, Suite 2B Providence, RI 02906',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    email: 'clinic@healthcare.com',
    password: 'clinic123',
    name: 'Providence Medical Clinic',
    companyName: 'Providence Medical Clinic',
    role: 'user',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PM&backgroundColor=10b981',
    phone: '+1 (555) 345-6789',
    address: '789 Health St, Chicago, IL 60601',
    createdAt: '2024-02-01T00:00:00Z',
  },
];

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      dummyUsers,

      login: async (email, password) => {
        const user = get().dummyUsers.find(
          (u) => u.email === email && u.password === password
        );
        if (user) {
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
