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
    isLoggedOut: boolean;
    setAuth: (data: { token: string; user: UserProfile }) => void;
    updateUser: (partialUser: Partial<UserProfile>) => void;
    logout: () => void;
}

export const AUTH_STORAGE_KEY = 'auth';
export const AUTH_LOGOUT_FLAG_KEY = 'awn_logged_out';

function isValidPersistedToken(token: unknown): token is string {
    return (
        typeof token === 'string' &&
        token.trim().length > 0 &&
        token !== 'null' &&
        token !== 'demo-jwt-token'
    );
}

function isValidPersistedUser(user: unknown): user is UserProfile {
    if (!user || typeof user !== 'object') return false;
    const candidate = user as Partial<UserProfile>;
    return (
        typeof candidate.id === 'string' &&
        candidate.id.trim().length > 0 &&
        candidate.id !== 'demo-admin-1' &&
        typeof candidate.fullName === 'string' &&
        candidate.fullName.trim().length > 0
    );
}

export function getInitialAuthState(): {
    token: string | null;
    user: UserProfile | null;
    isLoggedOut: boolean;
} {
    if (typeof window === 'undefined') {
        return {
            token: null,
            user: null,
            isLoggedOut: true,
        };
    }

    try {
        const loggedOutFlag = window.localStorage.getItem(AUTH_LOGOUT_FLAG_KEY);
        if (loggedOutFlag === 'true') {
            return {
                token: null,
                user: null,
                isLoggedOut: true,
            };
        }

        const rawAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (rawAuth) {
            const parsed = JSON.parse(rawAuth) as {
                state?: {
                    token?: string | null;
                    user?: UserProfile | null;
                    isLoggedOut?: boolean;
                };
                token?: string | null;
                user?: UserProfile | null;
                isLoggedOut?: boolean;
            };
            const stateObj = parsed?.state ?? parsed;

            if (
                stateObj &&
                stateObj.isLoggedOut !== true &&
                isValidPersistedToken(stateObj.token) &&
                isValidPersistedUser(stateObj.user)
            ) {
                return {
                    token: stateObj.token,
                    user: stateObj.user,
                    isLoggedOut: false,
                };
            }
        }
    } catch {
        // Fallback to unauthenticated state if localStorage is inaccessible or malformed
    }

    return {
        token: null,
        user: null,
        isLoggedOut: true,
    };
}

const initialState = getInitialAuthState();

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: initialState.token,
            user: initialState.user,
            isLoggedOut: initialState.isLoggedOut,

            setAuth: ({ token, user }) => {
                if (typeof window !== 'undefined') {
                    try {
                        window.localStorage.removeItem(AUTH_LOGOUT_FLAG_KEY);
                        window.localStorage.setItem('token', token);
                    } catch {
                        // Ignore storage errors
                    }
                }
                set({ token, user, isLoggedOut: false });
            },

            updateUser: (partialUser) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...partialUser } : null,
                })),

            logout: () => {
                if (typeof window !== 'undefined') {
                    try {
                        window.localStorage.setItem(AUTH_LOGOUT_FLAG_KEY, 'true');
                        window.localStorage.removeItem('token');
                    } catch {
                        // Ignore storage errors
                    }
                }
                set({ token: null, user: null, isLoggedOut: true });
            },
        }),
        {
            name: AUTH_STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
            merge: (persistedState, currentState) => {
                const persisted = (persistedState as Partial<AuthState> | undefined) ?? {};
                const explicitLogout =
                    (typeof window !== 'undefined' &&
                        window.localStorage.getItem(AUTH_LOGOUT_FLAG_KEY) === 'true') ||
                    persisted.isLoggedOut === true ||
                    !isValidPersistedToken(persisted.token) ||
                    !isValidPersistedUser(persisted.user);

                if (explicitLogout) {
                    return {
                        ...currentState,
                        token: null,
                        user: null,
                        isLoggedOut: true,
                    };
                }

                return {
                    ...currentState,
                    ...persisted,
                    token: persisted.token as string,
                    user: persisted.user as UserProfile,
                    isLoggedOut: false,
                };
            },
        }
    )
);

