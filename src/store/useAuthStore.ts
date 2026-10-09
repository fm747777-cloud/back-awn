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

export const DEMO_DEFAULT_TOKEN = 'demo-jwt-token';
export const DEMO_DEFAULT_USER: UserProfile = {
    id: 'demo-admin-1',
    type: 'Super Admin',
    fullName: 'Karim Wagdi',
};

export const AUTH_STORAGE_KEY = 'auth';
export const AUTH_LOGOUT_FLAG_KEY = 'awn_logged_out';

export function getInitialAuthState(): {
    token: string | null;
    user: UserProfile | null;
    isLoggedOut: boolean;
} {
    if (typeof window === 'undefined') {
        return {
            token: DEMO_DEFAULT_TOKEN,
            user: DEMO_DEFAULT_USER,
            isLoggedOut: false,
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
                (stateObj.isLoggedOut === true ||
                    stateObj.token === null ||
                    (typeof stateObj.token === 'string' && stateObj.token.trim() === ''))
            ) {
                return {
                    token: null,
                    user: null,
                    isLoggedOut: true,
                };
            }

            if (
                stateObj &&
                typeof stateObj.token === 'string' &&
                stateObj.token.trim().length > 0
            ) {
                return {
                    token: stateObj.token,
                    user: stateObj.user ?? DEMO_DEFAULT_USER,
                    isLoggedOut: false,
                };
            }
        }

        const legacyToken = window.localStorage.getItem('token');
        if (legacyToken !== null) {
            if (legacyToken.trim() === '' || legacyToken === 'null') {
                return {
                    token: null,
                    user: null,
                    isLoggedOut: true,
                };
            }
            return {
                token: legacyToken,
                user: DEMO_DEFAULT_USER,
                isLoggedOut: false,
            };
        }
    } catch {
        // Fallback to initial demo session if localStorage is inaccessible or malformed
    }

    return {
        token: DEMO_DEFAULT_TOKEN,
        user: DEMO_DEFAULT_USER,
        isLoggedOut: false,
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
                    persisted.token === null ||
                    (typeof persisted.token === 'string' && persisted.token.trim() === '');

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
                    token:
                        typeof persisted.token === 'string' && persisted.token.trim().length > 0
                            ? persisted.token
                            : currentState.token,
                    user: persisted.user ?? currentState.user,
                    isLoggedOut: false,
                };
            },
        }
    )
);

