import { Effect } from "effect"
import { Schema } from "@effect/schema"
import { TicketService, CreateTicketInput, ToggleTicketInput } from "../../domain/ticket"
import { successResponse, errorResponse } from "../../lib/utils"

export const mutations = {
  toggleTicket: (_: unknown, { input }: { input: unknown }) =>
    Effect.gen(function* () {
      const service = yield* TicketService

      const decoded = yield* Schema.decodeUnknown(ToggleTicketInput)(input)
      yield* Effect.logInfo(`Toggling ticket with ID: ${decoded.id} to ${decoded.isCompleted}`)

      return yield* service.toggleTicket(decoded).pipe(
        Effect.map((ticket) => ({
          message: `Updated ticket with ID ${ticket.id} to completed: ${ticket.completed} and all children`,
          data: ticket,
        })),
        Effect.andThen((result) => {
          return successResponse(result.data, result.message)
        })
      )
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
  createTicket: (_: unknown, { input }: { input: unknown }) =>
    Effect.gen(function* () {
      const service = yield* TicketService

      const decoded = yield* Schema.decodeUnknown(CreateTicketInput)(input)
      yield* Effect.logInfo(`Creating ticket with title: ${decoded.title}`)
      return yield* service.createTicket(decoded).pipe(
        Effect.map((ticket) => ({
          message: `Created ticket with ID ${ticket.id}`,
          data: ticket,
        })),
        Effect.andThen((result) => {
          return successResponse(result.data, result.message)
        })
      )
    }).pipe(
      Effect.retry({ times: 2, while: (e) => e._tag === "SqlError" }),
      Effect.timeout("2 seconds"),
      Effect.catchTags({
        ParseError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`Parse error: ${error.message}`)
            return yield* errorResponse(`Error parsing input: ${error.message}`)
          }),
        TicketCreationError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`Ticket creation error: ${error.message}`)
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
}
