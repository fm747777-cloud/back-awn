import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserProfile {
    id: string;
    type: string;
    fullName: string;
}

interface AuthState {
    token: string | null;
    user: UserProfile | null;
    setAuth: (data: { token: string; user: UserProfile }) => void;
    updateUser: (partialUser: Partial<UserProfile>) => void;
    logout: () => void;
}

const DEMO_DEFAULT_TOKEN = 'demo-jwt-token';
const DEMO_DEFAULT_USER: UserProfile = {
    id: 'demo-admin-1',
    type: 'Super Admin',
    fullName: 'Karim Wagdi',
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: DEMO_DEFAULT_TOKEN,
            user: DEMO_DEFAULT_USER,

            setAuth: ({ token, user }) => set({ token, user }),

            updateUser: (partialUser) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...partialUser } : null,
                })),

            logout: () => set({ token: null, user: null }),
        }),
        {
            name: 'auth',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
