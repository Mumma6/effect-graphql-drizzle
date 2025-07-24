export const typeDefs = `#graphql
  type Query {
 
    findById(id: ID!): FindByIdResult!
  }
  type FindByIdResult {
    success: Boolean!
    data: Ticket
    message: String
  }
  type Ticket {
    title: String!
    description: String!
    completed: Boolean!
    parentId: ID
    children: [Ticket!]!
  }
`
