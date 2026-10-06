'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { gql } from 'graphql-request';
import { graphqlClient } from './graphql-client';
import { authTokenStore } from './auth-token-store';
import { toast } from 'sonner';

export interface User {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  avatarUrl?: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { email: string; password: string; fullName: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      accessToken
      user {
        id
        email
        fullName
        emailVerified
        avatarUrl
        createdAt
      }
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        fullName
        emailVerified
        avatarUrl
        createdAt
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user {
        id
        email
        fullName
        emailVerified
        avatarUrl
        createdAt
      }
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshSession: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Silent refresh using HttpOnly cookie
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const data = await graphqlClient.request<{
        refreshToken: { accessToken: string; user: User };
      }>(REFRESH_TOKEN_MUTATION);

      if (data?.refreshToken?.accessToken) {
        // Store strictly in React / closure memory
        authTokenStore.setToken(data.refreshToken.accessToken, 900); // 15 mins
        setUser(data.refreshToken.user);
        return true;
      }
      return false;
    } catch {
      authTokenStore.clearToken();
      setUser(null);
      return false;
    }
  }, []);

  // Proactive silent refresh on initial mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      await refreshSession();
      if (isMounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    // Refresh every 13 minutes (before 15m JWT expiry)
    const interval = setInterval(() => {
      if (authTokenStore.hasValidToken()) {
        refreshSession();
      }
    }, 13 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshSession]);

  const login = async (input: { email: string; password: string }) => {
    try {
      const data = await graphqlClient.request<{
        login: { accessToken: string; user: User };
      }>(LOGIN_MUTATION, { input });

      authTokenStore.setToken(data.login.accessToken, 900);
      setUser(data.login.user);
      toast.success('Signed in successfully');
    } catch (err: any) {
      const message = err.response?.errors?.[0]?.message || 'Failed to sign in. Please check your credentials.';
      toast.error(message);
      throw new Error(message);
    }
  };

  const register = async (input: { email: string; password: string; fullName: string }) => {
    try {
      const data = await graphqlClient.request<{
        register: { accessToken: string; user: User };
      }>(REGISTER_MUTATION, { input });

      authTokenStore.setToken(data.register.accessToken, 900);
      setUser(data.register.user);
      toast.success('Account created successfully');
    } catch (err: any) {
      const message = err.response?.errors?.[0]?.message || 'Registration failed.';
      toast.error(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await graphqlClient.request(LOGOUT_MUTATION);
    } catch {
      // Proceed with client logout even if network fails
    } finally {
      authTokenStore.clearToken();
      setUser(null);
      toast.info('Signed out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
