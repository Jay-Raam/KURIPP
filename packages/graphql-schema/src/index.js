const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.graphql');
const typeDefs = fs.readFileSync(schemaPath, 'utf-8');

module.exports = {
  schemaPath,
  typeDefs,
};
