import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'awn_theme';

function readPersistedTheme(): ThemeMode {
    if (typeof window === 'undefined') {
        return 'light';
    }
    try {
        const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (raw === 'dark' || raw === 'light') {
            return raw;
        }
        if (raw) {
            const parsed = JSON.parse(raw) as { state?: { theme?: string } };
            if (parsed?.state?.theme === 'dark' || parsed?.state?.theme === 'light') {
                return parsed.state.theme;
            }
        }
    } catch {
        // Ignore malformed localStorage entries and default to light
    }
    return 'light';
}

export function applyThemeToDom(theme: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
    } else {
        root.classList.remove('dark');
        root.classList.add('light');
    }
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
}

function writePersistedTheme(theme: ThemeMode): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // Ignore storage quota errors
    }
}

const initialTheme: ThemeMode = readPersistedTheme();
applyThemeToDom(initialTheme);

interface ThemeState {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: initialTheme,
    setTheme: (nextTheme: ThemeMode) => {
        const normalized: ThemeMode = nextTheme === 'dark' ? 'dark' : 'light';
        writePersistedTheme(normalized);
        applyThemeToDom(normalized);
        set({ theme: normalized });
    },
    toggleTheme: () => {
        const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
        writePersistedTheme(nextTheme);
        applyThemeToDom(nextTheme);
        set({ theme: nextTheme });
    },
}));

if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === THEME_STORAGE_KEY || event.key === null) {
            const synced = readPersistedTheme();
            applyThemeToDom(synced);
            useThemeStore.setState({ theme: synced });
        }
    });
}
