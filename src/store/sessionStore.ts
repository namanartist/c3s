import { create } from 'zustand';
import type { UserRole } from '@/types/safety';

export interface SessionUser {
    name: string;
    identifier: string;
    role: UserRole;
    token?: string;
}

interface SessionState {
    user: SessionUser | null;
    signIn: (user: SessionUser) => void;
    signOut: () => void;
}

function readStoredUser(): SessionUser | null {
    try {
        const value = localStorage.getItem('c3s-session');
        return value ? JSON.parse(value) as SessionUser : null;
    } catch {
        return null;
    }
}

export const useSessionStore = create<SessionState>((set) => ({
    user: typeof window === 'undefined' ? null : readStoredUser(),
    signIn: (user) => {
        localStorage.setItem('c3s-session', JSON.stringify(user));
        set({ user });
    },
    signOut: () => {
        localStorage.removeItem('c3s-session');
        set({ user: null });
    }
}));