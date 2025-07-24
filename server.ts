import { ApolloServer } from "apollo-server"
import { makeExecutableSchema } from "@graphql-tools/schema"
import { typeDefs } from "./graphql/schema/typeDefs.js"
import { resolvers } from "./graphql/resolvers/index.js"
import { enableEffectResolvers } from "./adapter/effectAdapter.js"
import { Effect } from "effect"
import { SqlClient } from "@effect/sql"
import { SqlLive } from "./lib/db"

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
