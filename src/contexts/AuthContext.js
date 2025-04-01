import { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated on initial load
    const checkAuth = () => {
      const token = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("user");
      
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          // If parsing fails, set a default user
          setUser({ username: "User" });
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("auth_token", token || "authenticated");
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  const isAuthenticated = () => {
    return !!user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
