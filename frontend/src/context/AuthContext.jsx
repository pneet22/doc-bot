import { createContext, useContext, useMemo, useState } from "react";

import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("trustvault_token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("trustvault_user");
    return stored ? JSON.parse(stored) : null;
  });

  async function login(username, password) {
    const response = await api.post("/auth/login", { username, password });
    localStorage.setItem("trustvault_token", response.data.access_token);
    localStorage.setItem("trustvault_user", JSON.stringify(response.data.user));
    setToken(response.data.access_token);
    setUser(response.data.user);
    return response.data.user;
  }

  function logout() {
    localStorage.removeItem("trustvault_token");
    localStorage.removeItem("trustvault_user");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === "admin",
      login,
      logout
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

