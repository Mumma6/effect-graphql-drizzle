import { Effect, Layer } from "effect"
import { mapSchema, MapperKind } from "@graphql-tools/utils"
import { GraphQLSchema } from "graphql"
import { SqlLive } from "../lib/db"
import { TicketRepositoryLive } from "../domain/ticket/repository"
import { TicketServiceLive } from "../domain/ticket/service"

const AppLayer = Layer.mergeAll(SqlLive, TicketRepositoryLive, TicketServiceLive)

export const enableEffectResolvers = (schema: GraphQLSchema) => {
  return mapSchema(schema, {
    [MapperKind.ROOT_FIELD]: (fieldConfig) => {
      const originalResolver = fieldConfig.resolve
      if (!originalResolver) {
        return fieldConfig
      }
      return {
        ...fieldConfig,
        async resolve(parent, args, context, info) {
          const result = originalResolver(parent, args, context, info)

          if (Effect.isEffect(result)) {
            return await Effect.runPromise(result.pipe(Effect.provide(AppLayer)) as Effect.Effect<never, never, never>)
          }
        },
      }
    },
  })
}
