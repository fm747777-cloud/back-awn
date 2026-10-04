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

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: 'awn-jwt-token-active-session',
            user: {
                id: 'usr-1',
                type: 'Admin',
                fullName: 'Karim Wagdi',
            },

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
