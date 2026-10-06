import { describe, it, expect } from 'vitest';
import { createYoga } from 'graphql-yoga';
import { schema } from '../src/graphql/schema';
import { createDataLoaders } from '../src/lib/dataloaders';

describe('GraphQL Yoga v5 Root Resolvers', () => {
  it('executes the health query and returns system status', async () => {
    const yoga = createYoga({
      schema,
      context: () => ({
        loaders: createDataLoaders(),
      }),
    });

    const response = await yoga.fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query TestHealth {
            health {
              status
              version
              uptimeSeconds
              timestamp
            }
            openRouterModels {
              id
              name
              isFree
            }
          }
        `,
      }),
    });

    expect(response.status).toBe(200);
    const result = (await response.json()) as any;

    expect(result.errors).toBeUndefined();
    expect(result.data?.health?.status).toBe('UP');
    expect(result.data?.health?.version).toBe('0.1.0');
    expect(Array.isArray(result.data?.openRouterModels)).toBe(true);
    expect(result.data?.openRouterModels.length).toBeGreaterThan(0);
    expect(result.data?.openRouterModels[0].isFree).toBe(true);
  });
});
