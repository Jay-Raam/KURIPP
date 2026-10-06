'use client';

import React, { useState } from 'react';
import { useWorkspace, type Workspace } from '@/lib/workspace-context';
import { ChevronDown, Plus, Check, Briefcase, Loader2 } from 'lucide-react';

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, setCurrentWorkspace, createWorkspace, isLoading } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-8 items-center space-x-2 rounded border border-border px-2.5 text-xs text-muted-foreground font-mono">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading workspaces...</span>
      </div>
    );
  }

  if (!currentWorkspace && workspaces.length === 0) {
    return null;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setIsSubmitting(true);
    try {
      await createWorkspace({ name: newWsName, description: newWsDesc });
      setShowCreateModal(false);
      setNewWsName('');
      setNewWsDesc('');
      setIsOpen(false);
    } catch {
      // toast shown in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 items-center space-x-2 rounded border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
      >
        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono max-w-[130px] truncate">{currentWorkspace?.name || 'Select Workspace'}</span>
        {currentWorkspace?.role && (
          <span className="rounded bg-secondary px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
            {currentWorkspace.role}
          </span>
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-1.5 w-60 z-50 rounded-md border border-border bg-card p-1.5 shadow-lg">
            <div className="px-2 py-1 text-[11px] font-mono text-muted-foreground">
              Workspaces ({workspaces.length})
            </div>

            <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
              {workspaces.map((ws: Workspace) => {
                const isSelected = ws.id === currentWorkspace?.id;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
                      isSelected
                        ? 'bg-secondary font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    <div className="flex items-center space-x-1.5">
                      {ws.role && (
                        <span className="text-[10px] font-mono opacity-60">
                          {ws.role}
                        </span>
                      )}
                      {isSelected && <Check className="h-3 w-3 text-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-border pt-1 mt-1">
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setIsOpen(false);
                }}
                className="flex w-full items-center space-x-2 rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create new workspace</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Inline Modal for Creating Workspace */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Create Workspace</h3>
              <p className="text-xs text-muted-foreground">
                Set up an isolated domain for documents, chats, and research
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Legal Research Q4"
                  className="w-full rounded border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Description (Optional)</label>
                <input
                  type="text"
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="Brief context about this project"
                  className="w-full rounded border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
