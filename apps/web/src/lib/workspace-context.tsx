'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { gql } from 'graphql-request';
import { graphqlClient } from './graphql-client';
import { useAuth } from './auth-context';
import type { UserRole } from '@kuripp/shared-types';
import { toast } from 'sonner';

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string | null;
  role?: UserRole;
  createdAt: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  setCurrentWorkspace: (workspace: Workspace) => void;
  createWorkspace: (input: { name: string; description?: string }) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
}

const MY_WORKSPACES_QUERY = gql`
  query MyWorkspaces {
    myWorkspaces {
      id
      organizationId
      name
      slug
      description
      role
      createdAt
    }
  }
`;

const CREATE_WORKSPACE_MUTATION = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      id
      organizationId
      name
      slug
      description
      role
      createdAt
    }
  }
`;

const WorkspaceContext = createContext<WorkspaceContextType>({
  currentWorkspace: null,
  workspaces: [],
  isLoading: true,
  setCurrentWorkspace: () => {},
  createWorkspace: async () => { throw new Error('Not implemented'); },
  refreshWorkspaces: async () => {},
});

export const useWorkspace = () => useContext(WorkspaceContext);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await graphqlClient.request<{ myWorkspaces: Workspace[] }>(MY_WORKSPACES_QUERY);
      const list = data?.myWorkspaces || [];
      setWorkspaces(list);

      if (list.length > 0) {
        // Retrieve non-sensitive UI preference
        const savedWsId = typeof window !== 'undefined' ? localStorage.getItem('kuripp_active_ws') : null;
        const matched = list.find((w) => w.id === savedWsId);
        setCurrentWorkspaceState(matched || list[0] || null);
      } else {
        setCurrentWorkspaceState(null);
      }
    } catch {
      // Handled gracefully
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const setCurrentWorkspace = (ws: Workspace) => {
    setCurrentWorkspaceState(ws);
    try {
      localStorage.setItem('kuripp_active_ws', ws.id);
    } catch {
      // Non-critical UI preference
    }
  };

  const createWorkspace = async (input: { name: string; description?: string }): Promise<Workspace> => {
    try {
      const data = await graphqlClient.request<{ createWorkspace: Workspace }>(
        CREATE_WORKSPACE_MUTATION,
        { input }
      );
      const newWs = data.createWorkspace;
      toast.success(`Workspace "${newWs.name}" created`);
      await refreshWorkspaces();
      setCurrentWorkspace(newWs);
      return newWs;
    } catch (err: any) {
      const message = err.response?.errors?.[0]?.message || 'Failed to create workspace';
      toast.error(message);
      throw new Error(message);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        isLoading,
        setCurrentWorkspace,
        createWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
