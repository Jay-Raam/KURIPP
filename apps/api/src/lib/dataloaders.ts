import DataLoader from 'dataloader';
import { prisma } from './prisma';

export interface GraphQLDataLoaders {
  userLoader: DataLoader<string, any>;
  workspaceMembersLoader: DataLoader<string, any[]>;
}

export function createDataLoaders(): GraphQLDataLoaders {
  const userLoader = new DataLoader<string, any>(async (userIds) => {
    const users = await prisma.user.findMany({
      where: {
        id: { in: [...userIds] },
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return userIds.map((id) => userMap.get(id) || null);
  });

  const workspaceMembersLoader = new DataLoader<string, any[]>(async (workspaceIds) => {
    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: { in: [...workspaceIds] },
      },
      include: {
        user: true,
      },
    });

    const membersByWorkspace = new Map<string, any[]>();
    for (const member of members) {
      const list = membersByWorkspace.get(member.workspaceId) || [];
      list.push(member);
      membersByWorkspace.set(member.workspaceId, list);
    }

    return workspaceIds.map((id) => membersByWorkspace.get(id) || []);
  });

  return {
    userLoader,
    workspaceMembersLoader,
  };
}
