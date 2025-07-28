import { ApolloServer } from "apollo-server"
import { makeExecutableSchema } from "@graphql-tools/schema"
import { typeDefs } from "./graphql/schema/typeDefs.js"
import { resolvers } from "./graphql/resolvers/index.js"
import { enableEffectResolvers } from "./adapter/effectAdapter.js"
import { Effect } from "effect"
import { SqlClient } from "@effect/sql"
import { SqlLive } from "./lib/db"

/* 
📋 TODO LIST - TICKET MANAGEMENT SYSTEM
========================================

✅ COMPLETED TASKS
------------------
- [X] Add a resolver for the `findById` query
- [X] Add a resolver for the `findAll` query
  • Added offset and limit support
  • Only tickets with parentId = null are returned (root tickets)
- [X] Add a resolver for the `createTicket` mutation
- [X] Add a resolver for the `toggleTicket` mutation
- [X] Add a resolver for the `deleteTicket` mutation
- [X] Implement parent/child relations in queries
  • findAll and findById now return children as nested ticket lists
  • Children are populated using BFS traversal (not part of DB model)

🔄 REMAINING TASKS
------------------

1. [ ] Add `setParentOfTicket` mutation resolver
   • Purpose: Move a ticket to become a child of another ticket
   • Implementation needed:
     - Add input type: `SetParentInput { childId: ID!, parentId: ID! }`
     - Add mutation to schema: `setParentOfTicket(input: SetParentInput!): Response!`
     - Create resolver in mutations.ts using TicketService
     - Add validation to prevent circular relationships
     - Update repository to handle parentId changes
   • Validation: Ensure no circular parent-child relationships are created

2. [ ] Add `removeParentFromTicket` mutation resolver
   • Purpose: Convert a child ticket to a root-level ticket
   • Implementation needed:
     - Add input type: `RemoveParentInput { id: ID! }`
     - Add mutation to schema: `removeParentFromTicket(input: RemoveParentInput!): Response!`
     - Create resolver in mutations.ts using TicketService
     - Update repository to set parentId to null
   • Effect: Ticket becomes a root ticket (parentId = null)

3. [ ] Add `addChildrenToTicket` mutation resolver
   • Purpose: Add multiple tickets as children to a parent ticket
   • Implementation needed:
     - Add input type: `AddChildrenInput { parentId: ID!, childrenIds: [ID!]! }`
     - Add mutation to schema: `addChildrenToTicket(input: AddChildrenInput!): Response!`
     - Create resolver in mutations.ts using TicketService
     - Use Effect.all for parallel processing of multiple children
     - Update repository to handle batch parentId updates
   • Performance: Use parallel processing with Effect.all for efficiency

📝 IMPLEMENTATION NOTES
----------------------
• All new mutations should follow the same error handling pattern as existing ones
• Use the existing TicketService and TicketRepository structure
• Maintain consistent logging with emojis and descriptive messages
• Add appropriate GraphQL schema types for new input/output types
• Consider adding validation helpers in domain/ticket/helpers.ts
*/

const baseSchema = makeExecutableSchema({ typeDefs, resolvers })
const schema = enableEffectResolvers(baseSchema)

// Check that the 'tickets' table exists before starting the server
const checkDb = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const result = yield* sql`SELECT name FROM sqlite_master WHERE type='table' AND name='tickets'`
  if (result.length === 0) {
    yield* Effect.logWarning("Table 'tickets' does not exist. Please run 'npm run db:seed' before starting the server.")
    return process.exit(1)
  }
})

Effect.runPromise(checkDb.pipe(Effect.provide(SqlLive)))
  .then(() => {
    const server = new ApolloServer({
      schema,
      plugins: [
        {
          async requestDidStart() {
            return {
              async willSendResponse(requestContext) {
                // No-op, but could be used for logging or cleanup
              },
            }
          },
        },
      ],
    })

    server.listen({ port: 4000 }).then(({ url }) => {
      console.log(`🚀 Server ready at ${url}`)
    })
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
