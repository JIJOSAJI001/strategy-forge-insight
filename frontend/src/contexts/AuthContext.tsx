import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut, reload, getIdToken, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

type Role = "admin" | "retail";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  displayName: string | null;
  refreshUser: () => Promise<void>;
  role: Role | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

// Token cache to reduce Firebase API calls (tokens valid for 1 hour)
let cachedToken: string | null = null;
let tokenTimestamp: number = 0;
const TOKEN_CACHE_DURATION = 55 * 60 * 1000; // 55 minutes in milliseconds

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const navigate = useNavigate();

  // Centralized redirect function
  const redirectBasedOnRole = (userRole: Role) => {
    if (redirected) {
      console.log("Already redirected, skipping");
      return;
    }
    console.log("Redirecting based on role:", userRole);
    if (userRole === "admin") {
      navigate("/admin-dashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
    setRedirected(true);
  };

  // Optimized token retrieval with caching
  const getToken = async (): Promise<string | null> => {
    if (!user) return null;
    
    const now = Date.now();
    // Return cached token if still valid (less than 55 minutes old)
    if (cachedToken && (now - tokenTimestamp) < TOKEN_CACHE_DURATION) {
      return cachedToken;
    }
    
    // Fetch new token (don't force refresh unless cache is empty)
    try {
      cachedToken = await user.getIdToken(false);
      tokenTimestamp = now;
      return cachedToken;
    } catch (error) {
      console.error("Failed to get token:", error);
      // Clear cache on error
      cachedToken = null;
      tokenTimestamp = 0;
      return null;
    }
  };

  // Improved fetchUserRole with retry logic and cached tokens
  const fetchUserRole = async (firebaseUser: User) => {
    try {
      // Use cached token if available
      const now = Date.now();
      let token: string;
      
      if (cachedToken && (now - tokenTimestamp) < TOKEN_CACHE_DURATION) {
        token = cachedToken;
      } else {
        token = await firebaseUser.getIdToken(false);
        cachedToken = token;
        tokenTimestamp = now;
      }
      
      const apiBase = (import.meta as any).env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        console.log("401 error, retrying with fresh token...");
        // Clear cache and retry once with fresh token
        const freshToken = await firebaseUser.getIdToken(true);
        cachedToken = freshToken;
        tokenTimestamp = Date.now();
        
        const retryRes = await fetch(`${apiBase}/api/users/me`, {
          headers: { Authorization: `Bearer ${freshToken}` },
        });
        if (retryRes.ok) {
          return await retryRes.json();
        }
        throw new Error(`Backend request failed: ${retryRes.status}`);
      }

      if (!res.ok) {
        throw new Error(`Backend request failed: ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error("Failed to fetch user role:", err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setDisplayName(firebaseUser?.displayName ?? null);
      
      // Skip if we're in the middle of a manual login
      if (firebaseUser && !isLoggingIn) {
        console.log("Auth state changed, fetching role...");
        const userData = await fetchUserRole(firebaseUser);
        if (userData) {
          setRole(userData.role as Role);
          // Only redirect if we're on the landing page (page refresh scenario)
          const currentPath = window.location.pathname;
          if (currentPath === "/") {
            redirectBasedOnRole(userData.role as Role);
          }
        } else {
          setRole(null);
        }
      } else if (!firebaseUser) {
        setRole(null);
        setRedirected(false); // Reset redirect flag on logout
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isLoggingIn, navigate]);

  const logout = async () => {
    setRedirected(false);
    // Clear token cache on logout
    cachedToken = null;
    tokenTimestamp = 0;
    await signOut(auth);
  };

  const refreshUser = async () => {
    if (user) {
      await reload(user);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoggingIn(true);
      setRedirected(false);
      setLoading(true);
      console.log("Starting manual login process...");
      
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase login successful");
      
      // 2. Update user state
      setUser(userCredential.user);
      setDisplayName(userCredential.user.displayName);
      
      // 3. Fetch user role from backend
      const userData = await fetchUserRole(userCredential.user);
      if (userData) {
        setRole(userData.role as Role);
        redirectBasedOnRole(userData.role as Role);
      } else {
        throw new Error("Failed to fetch user role");
      }
      
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoggingIn(false);
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoggingIn(true);
      setRedirected(false);
      setLoading(true);
      console.log("Starting Google login process...");
      
      // 1. Sign in with Google
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      console.log("Google login successful");
      
      // 2. Update user state
      setUser(userCredential.user);
      setDisplayName(userCredential.user.displayName);
      
      // 3. Fetch user role from backend
      const userData = await fetchUserRole(userCredential.user);
      if (userData) {
        setRole(userData.role as Role);
        redirectBasedOnRole(userData.role as Role);
      } else {
        throw new Error("Failed to fetch user role");
      }
      
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    } finally {
      setIsLoggingIn(false);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, displayName, refreshUser, role, login, loginWithGoogle, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 