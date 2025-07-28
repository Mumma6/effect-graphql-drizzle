import { Effect } from "effect"
import { Schema } from "@effect/schema"
import { TicketService, CreateTicketInput, ToggleTicketInput, DeleteTicketInput, RemoveParentInput } from "../../domain/ticket"
import { successResponse, errorResponse } from "../../lib/utils"
import { HelperService } from "../../domain/ticket/helpers"

export const mutations = {
  toggleTicket: (_: unknown, { input }: { input: unknown }) =>
    Effect.gen(function* () {
      const service = yield* TicketService
      const helper = yield* HelperService

      const decoded = yield* Schema.decodeUnknown(ToggleTicketInput)(input)
      yield* Effect.logInfo(`🔄 Toggling completion status for ticket ID: ${decoded.id} to ${decoded.isCompleted}`)

      return yield* service.toggleTicket(decoded).pipe(
        Effect.map((ticket) => {
          const totalAffected = helper.getChildCount(ticket) + 1
          return {
            message: `✅ Updated completion status for "${ticket.title}" and ${totalAffected} child tickets to: ${decoded.isCompleted}`,
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
            yield* Effect.logError(`❌ Invalid toggle input format: ${error.message}`)
            return yield* errorResponse(`Invalid toggle parameters. Please provide a valid ticket ID and completion status.`)
          }),
        TicketNotFoundError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`🔍 Ticket not found for toggle operation: ${error.message}`)
            return yield* errorResponse(`Ticket not found. Cannot toggle completion status for non-existent ticket.`)
          }),
        TimeoutException: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`⏰ Toggle operation timeout after 2 seconds: ${error.message}`)
            return yield* errorResponse(`Toggle operation took too long. The ticket tree might be too large.`)
          }),
        SqlError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`💾 Database error during toggle cascade: ${error.message}`)
            return yield* errorResponse(`Database connection issue during toggle. Please try again later.`)
          }),
      })
    ),
  createTicket: (_: unknown, { input }: { input: unknown }) =>
    Effect.gen(function* () {
      const service = yield* TicketService

      const decoded = yield* Schema.decodeUnknown(CreateTicketInput)(input)
      yield* Effect.logInfo(`🎯 Creating new ticket: "${decoded.title}"`)

      return yield* service.createTicket(decoded).pipe(
        Effect.map((ticket) => ({
          message: `✅ Successfully created ticket "${ticket.title}" with ID: ${ticket.id}`,
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
            yield* Effect.logError(`❌ Invalid ticket creation input: ${error.message}`)
            return yield* errorResponse(`Invalid ticket data. Please provide a valid title and description.`)
          }),
        TicketCreationError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`❌ Failed to create ticket in database: ${error.message}`)
            return yield* errorResponse(`Failed to create ticket. Please check your input and try again.`)
          }),
        TimeoutException: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`⏰ Ticket creation timeout after 2 seconds: ${error.message}`)
            return yield* errorResponse(`Creation took too long. Please try again.`)
          }),
        SqlError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`💾 Database error during ticket creation: ${error.message}`)
            return yield* errorResponse(`Database connection issue. Please try again later.`)
          }),
      })
    ),
  deleteTicket: (_: unknown, input: unknown) =>
    Effect.gen(function* () {
      const service = yield* TicketService

      const decoded = yield* Schema.decodeUnknown(DeleteTicketInput)(input)
      yield* Effect.logInfo(`🗑️  Initiating cascade delete for ticket ID: ${decoded.id}`)

      return yield* service.deleteTicket(decoded.id).pipe(
        Effect.map((deletedIds) => {
          const totalDeleted = deletedIds.length
          const childrenDeleted = totalDeleted - 1
          return {
            message: `🗑️  Successfully deleted ticket and ${childrenDeleted} child tickets (${totalDeleted} total tickets removed)`,
            data: deletedIds,
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
            yield* Effect.logError(`❌ Invalid delete input format: ${error.message}`)
            return yield* errorResponse(`Invalid delete parameters. Please provide a valid ticket ID.`)
          }),
        TicketNotFoundError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`🔍 Ticket not found for deletion: ${error.message}`)
            return yield* errorResponse(`Ticket not found. Cannot delete non-existent ticket.`)
          }),
        TimeoutException: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`⏰ Delete operation timeout after 2 seconds: ${error.message}`)
            return yield* errorResponse(`Delete operation took too long. The ticket tree might be too large.`)
          }),
        SqlError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`💾 Database error during cascade delete: ${error.message}`)
            return yield* errorResponse(`Database connection issue during delete. Please try again later.`)
          }),
      })
    ),
  removeParentFromTicket: (_: unknown, { input }: { input: unknown }) =>
    Effect.gen(function* () {
      const service = yield* TicketService

      const decoded = yield* Schema.decodeUnknown(RemoveParentInput)(input)
      yield* Effect.logInfo(`🔄 Initiating parent removal for ticket ID: ${decoded.id}`)

      return yield* service.removeParentFromTicket(decoded.id).pipe(
        Effect.map((ticket) => {
          const isAlreadyRoot = ticket.parentId === null
          const message = isAlreadyRoot
            ? `ℹ️  Ticket "${ticket.title}" (ID: ${ticket.id}) is already a root ticket`
            : `✅ Successfully removed parent from ticket "${ticket.title}" (ID: ${ticket.id}). Ticket is now a root ticket.`

          return {
            message,
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
            yield* Effect.logError(`❌ Invalid remove parent input format: ${error.message}`)
            return yield* errorResponse(`Invalid input parameters. Please provide a valid ticket ID.`)
          }),
        TicketNotFoundError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`🔍 Ticket not found for parent removal: ${error.message}`)
            return yield* errorResponse(`Ticket not found. Cannot remove parent from non-existent ticket.`)
          }),
        TimeoutException: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`⏰ Parent removal timeout after 2 seconds: ${error.message}`)
            return yield* errorResponse(`Parent removal took too long. Please try again.`)
          }),
        SqlError: (error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`💾 Database error during parent removal: ${error.message}`)
            return yield* errorResponse(`Database connection issue during parent removal. Please try again later.`)
          }),
      })
    ),
}
