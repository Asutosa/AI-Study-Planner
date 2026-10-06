import { createContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../services/api';

const TOKEN_KEY = 'aiStudyPlannerToken';
const USER_KEY = 'aiStudyPlannerUser';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      return;
    }

    getCurrentUser(storedToken)
      .then((response) => {
        setToken(storedToken);
        setUser(response.user);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const response = await loginUser(credentials);
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
    return response;
  };

  const register = async (userData) => registerUser(userData);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, loading, register, login, logout }), [
    user,
    token,
    loading,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
