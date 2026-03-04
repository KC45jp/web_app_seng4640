import type { PersistedUserRoleValue, UserRoleValue } from "@seng4640/shared";
import { create } from "zustand";
import { ROLE } from "@/constants/roles";

const AUTH_STORAGE_KEY = "seng4640.auth";

type AuthState = {
  role: UserRoleValue;
  token: string | null;
  loginAs: (role: PersistedUserRoleValue) => void;
  logout: () => void;
};

type StoredAuthState = {
  role: PersistedUserRoleValue;
  token: string;
};

function parseStoredAuth(): StoredAuthState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuthState>;

    if (
      (parsed.role === ROLE.CUSTOMER ||
        parsed.role === ROLE.MANAGER ||
        parsed.role === ROLE.ADMIN) &&
      typeof parsed.token === "string" &&
      parsed.token.length > 0
    ) {
      return {
        role: parsed.role,
        token: parsed.token,
      };
    }
  } catch {
    // Ignore broken localStorage data and treat as guest.
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  return null;
}

function persistAuth(state: StoredAuthState | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!state) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

const initialAuth = parseStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
  role: initialAuth?.role ?? ROLE.GUEST,
  token: initialAuth?.token ?? null,
  loginAs: (role) => {
    const stored = {
      role,
      token: `mock-${role}-token`,
    };

    persistAuth(stored);
    set(stored);
  },
  logout: () => {
    persistAuth(null);
    set({ role: ROLE.GUEST, token: null });
  },
}));
