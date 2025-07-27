export const typeDefs = `#graphql
  type Query {
    findAll(offset: Int, limit: Int): FindAllResult!
    findById(id: ID!): FindByIdResult!
  }

  type Mutation {
    createTicket(input: CreateTicketInput!): CreateTicketResult!
  }

  type CreateTicketResult {
    success: Boolean!
    data: Ticket
    message: String
  }

  input CreateTicketInput {
    title: String!
    description: String!
  }

  type FindByIdResult {
    success: Boolean!
    data: Ticket
    message: String
  }

  type FindAllResult {
    success: Boolean!
    data: [Ticket!]!
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
