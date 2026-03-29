import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetSession } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  alias: string | null;
  vibrationLevel: string | null;
  plan: "free" | "ascended" | null;
  dailyLimit: number | null;
  remainingToday: number | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem("energy_session_token");
  });

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("energy_session_token", newToken);
    } else {
      localStorage.removeItem("energy_session_token");
    }
    setTokenState(newToken);
  };

  const logout = () => setToken(null);

  const { data: session, isLoading } = useGetSession(
    { request: { headers: token ? { Authorization: `Bearer ${token}` } : undefined } },
    { query: { enabled: !!token, retry: false, refetchInterval: 30000 } }
  );

  useEffect(() => {
    if (token && session && !session.valid) logout();
  }, [session, token]);

  const isAuthenticated = !!token && !!session?.valid;

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        isAuthenticated,
        isLoading: !!token && isLoading,
        alias: session?.alias ?? null,
        vibrationLevel: session?.vibrationLevel ?? null,
        plan: (session?.plan as "free" | "ascended") ?? null,
        dailyLimit: (session?.dailyLimit as number | null) ?? null,
        remainingToday: (session?.remainingToday as number | null) ?? null,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
