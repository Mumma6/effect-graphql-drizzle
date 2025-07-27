import { Effect } from "effect"
import { Schema } from "@effect/schema"
import { TicketService, FindTicketByIdInput, CreateTicketInput, FindAllTicketsInput } from "../../domain/ticket"
import { successResponse, errorResponse } from "../../lib/utils"

export const resolvers = {
  Query: {
    findAll: (_: unknown, input: unknown) =>
      Effect.gen(function* () {
        const service = yield* TicketService

        const decoded = yield* Schema.decodeUnknown(FindAllTicketsInput)(input)
        yield* Effect.logInfo(`Resolving all tickets with offset: ${decoded.offset} and limit: ${decoded.limit}`)
        const tickets = yield* service.findAll(decoded.offset, decoded.limit)

        return yield* successResponse(tickets)
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
        })
      ),
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
  Mutation: {
    createTicket: (_: unknown, { input }: { input: unknown }) =>
      Effect.gen(function* () {
        const service = yield* TicketService

        const decoded = yield* Schema.decodeUnknown(CreateTicketInput)(input)
        yield* Effect.logInfo(`Creating ticket with title: ${decoded.title}`)
        const ticket = yield* service.createTicket(decoded)

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
  },
}
