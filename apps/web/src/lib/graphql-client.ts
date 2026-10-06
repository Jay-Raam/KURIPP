import { GraphQLClient } from 'graphql-request';
import { authTokenStore } from './auth-token-store';

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
  (typeof window !== 'undefined' ? '/graphql' : 'http://localhost:4000/graphql');

export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  fetch: (url, init) => {
    const token = authTokenStore.getToken();
    const headers = new Headers(init?.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(url, {
      ...init,
      headers,
      credentials: 'include', // Transmits HttpOnly refresh cookie automatically
    });
  },
});
