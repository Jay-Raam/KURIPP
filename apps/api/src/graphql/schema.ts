import { createSchema } from 'graphql-yoga';
import { typeDefs } from '@kuripp/graphql-schema';
import { resolvers } from './resolvers';

export const schema = createSchema({
  typeDefs,
  resolvers,
});
