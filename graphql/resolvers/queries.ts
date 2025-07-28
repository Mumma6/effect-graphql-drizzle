import { Effect } from "effect"
import { Schema } from "@effect/schema"
import { TicketService, FindTicketByIdInput, CreateTicketInput, FindAllTicketsInput } from "../../domain/ticket"
import { successResponse, errorResponse } from "../../lib/utils"
import { HelperService } from "../../domain/ticket/helpers"

export const queries = {
  findAll: (_: unknown, { input }: { input: unknown }) =>
    Effect.gen(function* () {
      const service = yield* TicketService

      const decoded = yield* Schema.decodeUnknown(FindAllTicketsInput)(input)
      yield* Effect.logInfo(`🔍 Fetching root tickets (offset: ${decoded.offset}, limit: ${decoded.limit})`)

      return yield* service.findAll(decoded).pipe(
        Effect.map((tickets) => {
          return {
            message: `📋 Retrieved ${tickets.length} root tickets`,
            data: tickets,
          }
        }),
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
            yield* Effect.logError(`❌ Invalid input format for findAll query: ${error.message}`)
            return yield* errorResponse(`Invalid query parameters. Please check your offset and limit values.`)
          }),
        NoTicketsFoundError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`📭 No root tickets found in database: ${error.message}`)
            return yield* errorResponse(`No tickets found. The database appears to be empty.`)
          }),
        TimeoutException: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`⏰ Query timeout after 2 seconds: ${error.message}`)
            return yield* errorResponse(`Query took too long to complete. Please try again with a smaller limit.`)
          }),
        SqlError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`💾 Database error after retries: ${error.message}`)
            return yield* errorResponse(`Database connection issue. Please try again later.`)
          }),
        NoSuchElementException: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`🔍 Element not found in query result: ${error.message}`)
            return yield* errorResponse(`Unexpected data structure. Please contact support.`)
          }),
      })
    ),
  findById: (_: unknown, input: unknown) =>
    Effect.gen(function* () {
      const service = yield* TicketService
      const helper = yield* HelperService

      const decoded = yield* Schema.decodeUnknown(FindTicketByIdInput)(input)
      yield* Effect.logInfo(`🔍 Fetching ticket tree for ID: ${decoded.id}`)
      return yield* service.findById(decoded.id).pipe(
        Effect.map((ticket) => {
          const totalDescendants = helper.getChildCount(ticket)
          const directChildren = ticket.children.length
          return {
            message: `🌳 Found ticket "${ticket.title}" (ID: ${ticket.id}) with ${directChildren} direct children and ${totalDescendants} total descendants`,
            data: ticket,
          }
        }),
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
            yield* Effect.logError(`❌ Invalid ticket ID format: ${error.message}`)
            return yield* errorResponse(`Invalid ticket ID. Please provide a valid numeric ID.`)
          }),
        TicketNotFoundError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`🔍 Ticket not found in database: ${error.message}`)
            return yield* errorResponse(`Ticket not found. The specified ID does not exist in the database.`)
          }),
        TimeoutException: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`⏰ Ticket tree query timeout after 2 seconds: ${error.message}`)
            return yield* errorResponse(`Query took too long to complete. The ticket tree might be too large.`)
          }),
        SqlError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`💾 Database error while fetching ticket tree: ${error.message}`)
            return yield* errorResponse(`Database connection issue while fetching ticket. Please try again later.`)
          }),
      })
    ),
}
