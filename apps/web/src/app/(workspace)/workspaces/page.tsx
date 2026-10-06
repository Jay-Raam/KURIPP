'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { CommandPaletteTrigger } from '@/components/command-palette';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphqlClient } from '@/lib/graphql-client';
import {
  Users,
  Shield,
  Activity,
  UserPlus,
  Trash2,
  Loader2,
  Clock,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '@kuripp/shared-types';

const WORKSPACE_MEMBERS_QUERY = gql`
  query GetWorkspaceMembers($workspaceId: ID!) {
    workspaceMembers(workspaceId: $workspaceId) {
      id
      workspaceId
      role
      createdAt
      user {
        id
        email
        fullName
        avatarUrl
      }
    }
  }
`;

const AUDIT_LOGS_QUERY = gql`
  query GetAuditLogs($workspaceId: ID!) {
    auditLogs(workspaceId: $workspaceId, limit: 30) {
      id
      action
      resourceType
      resourceId
      ipHash
      createdAt
      user {
        email
        fullName
      }
    }
  }
`;

const INVITE_MEMBER_MUTATION = gql`
  mutation InviteWorkspaceMember($input: InviteMemberInput!) {
    inviteWorkspaceMember(input: $input) {
      id
      role
    }
  }
`;

const UPDATE_ROLE_MUTATION = gql`
  mutation UpdateMemberRole($input: UpdateMemberRoleInput!) {
    updateMemberRole(input: $input) {
      id
      role
    }
  }
`;

const REMOVE_MEMBER_MUTATION = gql`
  mutation RemoveWorkspaceMember($workspaceId: ID!, $memberId: ID!) {
    removeWorkspaceMember(workspaceId: $workspaceId, memberId: $memberId)
  }
`;

type TabType = 'overview' | 'members' | 'audit';

export default function WorkspaceManagementPage() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);

  const workspaceId = currentWorkspace?.id || '';

  // Query workspace members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return { workspaceMembers: [] };
      return graphqlClient.request<{
        workspaceMembers: Array<{
          id: string;
          role: UserRole;
          createdAt: string;
          user: { id: string; email: string; fullName: string };
        }>;
      }>(WORKSPACE_MEMBERS_QUERY, { workspaceId });
    },
    enabled: Boolean(workspaceId),
  });

  // Query workspace audit logs
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['workspace-audit-logs', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return { auditLogs: [] };
      return graphqlClient.request<{
        auditLogs: Array<{
          id: string;
          action: string;
          resourceType: string;
          ipHash?: string;
          createdAt: string;
          user?: { email: string; fullName: string };
        }>;
      }>(AUDIT_LOGS_QUERY, { workspaceId });
    },
    enabled: Boolean(workspaceId && activeTab === 'audit'),
  });

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: async () => {
      return graphqlClient.request(INVITE_MEMBER_MUTATION, {
        input: {
          workspaceId,
          email: inviteEmail,
          role: inviteRole,
        },
      });
    },
    onSuccess: () => {
      toast.success(`Member invited successfully`);
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-audit-logs', workspaceId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.errors?.[0]?.message || 'Failed to invite member');
    },
    onSettled: () => setIsInviting(false),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: UserRole }) => {
      return graphqlClient.request(UPDATE_ROLE_MUTATION, {
        input: { workspaceId, memberId, role },
      });
    },
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.errors?.[0]?.message || 'Failed to update role');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return graphqlClient.request(REMOVE_MEMBER_MUTATION, {
        workspaceId,
        memberId,
      });
    },
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.errors?.[0]?.message || 'Failed to remove member');
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    inviteMutation.mutate();
  };

  if (!currentWorkspace) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-foreground">
        <div className="text-center space-y-2">
          <Briefcase className="h-8 w-8 text-muted-foreground mx-auto" />
          <h2 className="text-sm font-semibold">No Workspace Selected</h2>
          <p className="text-xs text-muted-foreground">Select or create a workspace to manage settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center font-mono font-bold text-xs text-foreground">
              KW
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">SETTINGS</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-semibold text-foreground">{currentWorkspace.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <CommandPaletteTrigger />
            <WorkspaceSwitcher />
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
            >
              Home
            </Link>
            <Link
              href="/chat"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
            >
              Research Chat
            </Link>
            <Link
              href="/research"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
            >
              Research Studio
            </Link>
            <Link
              href="/documents"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
            >
              Document Vault
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 py-10 px-6">
        {/* Workspace Title & Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold tracking-tight">{currentWorkspace.name}</h1>
              <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                Role: {currentWorkspace.role}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Slug: <span className="font-mono text-foreground">{currentWorkspace.slug}</span> · ID: <span className="font-mono text-muted-foreground">{currentWorkspace.id.slice(0, 8)}...</span>
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 border border-border rounded-lg bg-card p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-1.5 px-3 py-1 text-xs rounded transition-colors ${
                activeTab === 'overview' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center space-x-1.5 px-3 py-1 text-xs rounded transition-colors ${
                activeTab === 'members' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Team Members</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-1.5 px-3 py-1 text-xs rounded transition-colors ${
                activeTab === 'audit' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Tab Content: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-sm font-semibold">Workspace Configuration</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Workspace Name:</span>
                  <div className="font-medium">{currentWorkspace.name}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Unique Slug:</span>
                  <div className="font-mono">{currentWorkspace.slug}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Organization ID:</span>
                  <div className="font-mono">{currentWorkspace.organizationId}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Created:</span>
                  <div className="font-mono">{new Date(currentWorkspace.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-semibold">Server-Side RBAC Enforcement</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All workspace resources (documents, vectors, research queries, chat threads) enforce
                strict isolation using PostgreSQL tenant queries. Role-based capabilities are verified
                on the API boundary.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content: Team Members */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Invite Form */}
            {['OWNER', 'ADMIN'].includes(currentWorkspace.role || '') && (
              <div className="rounded-lg border border-border bg-card p-5 space-y-4">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs font-semibold">Invite Team Member</h3>
                </div>

                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@organization.com"
                    className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />

                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="rounded border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  >
                    <option value="MEMBER">MEMBER (Read & Write)</option>
                    <option value="ADMIN">ADMIN (Manage Members)</option>
                    <option value="VIEWER">VIEWER (Read Only)</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isInviting}
                    className="rounded bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-60 flex items-center justify-center space-x-1.5"
                  >
                    {isInviting ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Add Member</span>}
                  </button>
                </form>
              </div>
            )}

            {/* Members Table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border text-xs font-semibold">
                Active Members ({membersData?.workspaceMembers.length || 0})
              </div>

              {membersLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground font-mono">
                  Loading members...
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {membersData?.workspaceMembers.map((m) => {
                    const isSelf = m.user.id === user?.id;
                    const canManage = ['OWNER', 'ADMIN'].includes(currentWorkspace.role || '') && !isSelf;

                    return (
                      <div key={m.id} className="flex items-center justify-between px-5 py-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-medium flex items-center space-x-1.5">
                            <span>{m.user.fullName || m.user.email}</span>
                            {isSelf && (
                              <span className="rounded bg-secondary px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground font-mono text-[11px]">{m.user.email}</div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {canManage ? (
                            <select
                              value={m.role}
                              onChange={(e) =>
                                updateRoleMutation.mutate({
                                  memberId: m.id,
                                  role: e.target.value as UserRole,
                                })
                              }
                              className="rounded border border-input bg-background px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              <option value="OWNER">OWNER</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="MEMBER">MEMBER</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>
                          ) : (
                            <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                              {m.role}
                            </span>
                          )}

                          {canManage && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${m.user.email} from workspace?`)) {
                                  removeMemberMutation.mutate(m.id);
                                }
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              title="Remove member"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold">Append-Only Audit Log</span>
              <span className="text-[11px] font-mono text-muted-foreground">Recent 30 Events</span>
            </div>

            {auditLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground font-mono">
                Loading audit trail...
              </div>
            ) : auditData?.auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No recorded audit events for this workspace yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {auditData?.auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between px-5 py-3 text-xs gap-4">
                    <div className="space-y-0.5">
                      <div className="font-mono font-medium text-foreground">{log.action}</div>
                      <div className="text-muted-foreground text-[11px]">
                        Triggered by: <span className="font-mono text-foreground">{log.user?.fullName || log.user?.email || 'System'}</span>
                        {log.ipHash && <span> · IP: {log.ipHash}</span>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-muted-foreground font-mono text-[11px] shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
