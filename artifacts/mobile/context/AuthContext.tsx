import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface UserPreferences {
  defaultGenre?: string;
  defaultArtStyle?: string;
  defaultDifficulty?: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  role: string;
  subscriptionTier: string;
  aiCreditsUsed?: number;
  aiCreditsLimit?: number;
  totalProjects?: number;
  totalAssets?: number;
  totalGenerations?: number;
  preferences?: UserPreferences;
  notificationSettings?: Record<string, boolean>;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    email: string,
    username: string,
    displayName: string,
    password: string
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  patchUser: (updates: {
    displayName?: string;
    bio?: string;
    preferences?: Record<string, unknown>;
    notificationSettings?: Record<string, boolean>;
  }) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEYS = {
  ACCESS_TOKEN: "@genforge_access_token",
  REFRESH_TOKEN: "@genforge_refresh_token",
  USER: "@genforge_user",
};

const API_BASE = "/api";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

const GUEST_USER: AuthUser = {
  id: "guest",
  email: "guest@genforgeai.com",
  username: "guest",
  displayName: "Guest Developer",
  role: "guest",
  subscriptionTier: "free",
  aiCreditsUsed: 0,
  aiCreditsLimit: 10,
  totalProjects: 0,
  totalGenerations: 0,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    async function restore() {
      try {
        const [token, userJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
        ]);
        if (token && userJson) {
          setState({
            user: JSON.parse(userJson) as AuthUser,
            accessToken: token,
            isLoading: false,
            isAuthenticated: true,
          });
          return;
        }
      } catch {
        // ignore storage errors
      }
      setState((s) => ({ ...s, isLoading: false }));
    }
    restore();
  }, []);

  const persistSession = useCallback(
    async (user: AuthUser, accessToken: string, refreshToken?: string) => {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
        refreshToken
          ? AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
          : Promise.resolve(),
      ]);
      setState({
        user,
        accessToken,
        isLoading: false,
        isAuthenticated: true,
      });
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      try {
        const data = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        await persistSession(data.user, data.accessToken, data.refreshToken);
        return {};
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Login failed" };
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async (
      email: string,
      username: string,
      displayName: string,
      password: string
    ): Promise<{ error?: string }> => {
      try {
        const data = await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, username, displayName, password }),
        });
        await persistSession(data.user, data.accessToken, data.refreshToken);
        return {};
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Registration failed" };
      }
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (state.accessToken) {
      try {
        await apiFetch("/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${state.accessToken}` },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // ignore
      }
    }
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
    ]);
    setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
  }, [state.accessToken]);

  const continueAsGuest = useCallback(() => {
    setState({
      user: GUEST_USER,
      accessToken: null,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setState((s) => {
      if (!s.user) return s;
      const updated = { ...s.user, ...updates };
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      return { ...s, user: updated };
    });
  }, []);

  const patchUser = useCallback(
    async (updates: {
      displayName?: string;
      bio?: string;
      preferences?: Record<string, unknown>;
      notificationSettings?: Record<string, boolean>;
    }): Promise<{ error?: string }> => {
      if (!state.accessToken) return { error: "Not authenticated" };
      try {
        const data = await apiFetch("/users/me", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${state.accessToken}` },
          body: JSON.stringify(updates),
        });
        const merged = { ...state.user, ...data.user } as AuthUser;
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(merged));
        setState((s) => ({ ...s, user: merged }));
        return {};
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Update failed" };
      }
    },
    [state.accessToken, state.user]
  );

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, continueAsGuest, updateUser, patchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
