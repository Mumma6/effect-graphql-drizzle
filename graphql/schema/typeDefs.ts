export const typeDefs = `#graphql
  type Query {
    findAll(input: FindAllTicketsInput!): FindAllResponse!
    findById(id: ID!): Response!
  }

  type Mutation {
    createTicket(input: CreateTicketInput!): CreateTicketResponse!
    toggleTicket(input: ToggleTicketInput!): Response!
    deleteTicket(id: ID!): DeleteTicketResponse!
    removeParentFromTicket(input: RemoveParentInput!): Response!
  }

  type Response {
    success: Boolean!
    data: Ticket
    message: String
  }

  type FindAllResponse {
    success: Boolean!
    data: [Ticket!]!
    message: String
  }

  type DeleteTicketResponse {
    success: Boolean!
    data: [DeletedTicket!]
    message: String
  }

  type DeletedTicket {
    deletedId: ID!
  }

  input FindAllTicketsInput {
    offset: Int!
    limit: Int!
  }

  input CreateTicketInput {
    title: String!
    description: String!
  }

  input ToggleTicketInput {
    id: ID!
    isCompleted: Boolean!
  }

  input RemoveParentInput {
    id: ID!
  }

  type Ticket {
    title: String!
    description: String!
    completed: Boolean!
    parentId: ID
    children: [Ticket!]!
  }

  type CreatedTicket {
    id: ID!
    title: String!
    description: String!
    completed: Boolean!
    parentId: ID
  }

  type CreateTicketResponse {
    success: Boolean!
    data: Ticket!
    message: String
  }

`
