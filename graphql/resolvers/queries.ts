import { Effect } from "effect"
import { Schema } from "@effect/schema"
import { TicketService, FindTicketByIdInput, CreateTicketInput, FindAllTicketsInput } from "../../domain/ticket"
import { successResponse, errorResponse } from "../../lib/utils"

export const queries = {
  findAll: (_: unknown, { input }: { input: unknown }) =>
    Effect.gen(function* () {
      const service = yield* TicketService

      console.log(input)

      const decoded = yield* Schema.decodeUnknown(FindAllTicketsInput)(input)
      yield* Effect.logInfo(`Resolving all tickets with offset: ${decoded.offset} and limit: ${decoded.limit}`)

      return yield* service.findAll(decoded).pipe(
        Effect.map((tickets) => ({
          message: `Found ${tickets.length} tickets`,
          data: tickets,
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
        NoTicketsFoundError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`No tickets found: ${error.message}`)
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
        NoSuchElementException: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`No such element: ${error.message}`)
            return yield* errorResponse(error.message)
          }),
      })
    ),
  findById: (_: unknown, input: unknown) =>
    Effect.gen(function* () {
      const service = yield* TicketService

      const decoded = yield* Schema.decodeUnknown(FindTicketByIdInput)(input)
      yield* Effect.logInfo(`Resolving ticket by ID: ${decoded.id}`)
      return yield* service.findById(decoded.id).pipe(
        Effect.map((ticket) => ({
          message: `Found ticket with ID ${ticket.id}`,
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
}
