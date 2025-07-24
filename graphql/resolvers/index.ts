import { Effect } from "effect"
import { Schema } from "@effect/schema"
import { TicketService, FindTicketByIdInput } from "../../domain/ticket"
import { successResponse, errorResponse } from "../../lib/utils"

export const resolvers = {
  Query: {
    findById: (_: unknown, input: unknown) =>
      Effect.gen(function* () {
        const service = yield* TicketService

        const decoded = yield* Schema.decodeUnknown(FindTicketByIdInput)(input)
        yield* Effect.logInfo(`Resolving ticket by ID: ${decoded.id}`)
        const ticket = yield* service.findById(decoded.id)

        return yield* successResponse(ticket)
      }).pipe(
        Effect.retry({ times: 2, while: (e) => e._tag === "SqlError" }),
        Effect.timeout("2 seconds"),
        Effect.catchTags({
          ParseError: (error) =>
            Effect.gen(function* () {
              yield* Effect.logError(`Parse error: ${error.message}`)
              return yield* errorResponse(`Parse error: ${error.message}`)
            }),
          TicketNotFoundError: (error) =>
            Effect.gen(function* () {
              yield* Effect.logError(`Ticket not found: ${error.message}`)
              return yield* errorResponse(error.message)
            }),
          TimeoutException: (error) =>
            Effect.gen(function* () {
              yield* Effect.logError(`Timeout: ${error.message}`)
              return yield* errorResponse(error.message)
            }),
          SqlError: (error) =>
            Effect.gen(function* () {
              yield* Effect.logError(`All retries failed due to SQL error: ${error.message}`)
              return yield* errorResponse(error.message)
            }),
        })
      ),
  },
}
