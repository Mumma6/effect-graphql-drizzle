import { Effect, Option } from "effect"
import { NoTicketsFoundError, TicketCreationError, TicketNotFoundError } from "../errors"
import { FindAllTicketsInput, TicketId, ToggleTicketInput } from "./schema"
import { TicketRepository } from "./repository"
import { CreateTicketInput } from "./schema"
import { HelperService } from "./helpers"

export class TicketService extends Effect.Service<TicketService>()("Ticket/Service", {
  effect: Effect.gen(function* () {
    const repository = yield* TicketRepository
    const helper = yield* HelperService

    const toggleTicket = (input: typeof ToggleTicketInput.Type) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`🔄 Starting cascade toggle for ticket ID: ${input.id} to ${input.isCompleted}`)

        const toggled = yield* repository.toggleTicket(input).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () =>
                Effect.gen(function* () {
                  yield* Effect.logWarning(`❌ No ticket found with ID ${input.id} for toggle operation`)
                  return yield* Effect.fail(new TicketNotFoundError(`Failed to toggle ticket with ID ${input.id}`))
                }),
              onSome: Effect.succeed,
            })
          )
        )

        const tree = yield* helper.findChildrenBFS(toggled)
        const allTickets = helper.flattenTree(tree)

        yield* Effect.logInfo(`🔄 Toggling ${allTickets.length} tickets to ${input.isCompleted}`)

        yield* Effect.forEach(
          allTickets,
          (ticket) =>
            Effect.gen(function* () {
              yield* repository.toggleTicket({ id: ticket.id as TicketId, isCompleted: input.isCompleted })
            }),
          { concurrency: 5 }
        )

        yield* Effect.logInfo(`✅ Cascade toggle completed: ${allTickets.length} tickets updated`)
        return tree
      })

    const findById = (id: TicketId) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`🔍 Looking for ticket with ID: ${id}`)

        return yield* Effect.flatMap(
          repository.findById(id),
          Option.match({
            onNone: () =>
              Effect.gen(function* () {
                yield* Effect.logWarning(`❌ No ticket found with ID ${id}`)
                return yield* Effect.fail(new TicketNotFoundError(`Failed to find ticket with ID ${id}`))
              }),
            onSome: (ticket) =>
              Effect.gen(function* () {
                yield* Effect.logInfo(`✅ Found ticket with ID ${ticket.id}: "${ticket.title}"`)
                return ticket
              }),
          })
        ).pipe(Effect.flatMap((ticket) => helper.findChildrenBFS(ticket)))
      })

    const createTicket = (input: typeof CreateTicketInput.Type) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`🎯 Creating new ticket: "${input.title}"`)

        return yield* Effect.flatMap(
          repository.createTicket(input),
          Option.match({
            onNone: () =>
              Effect.gen(function* () {
                yield* Effect.logWarning(`❌ Failed to create ticket: "${input.title}"`)
                return yield* Effect.fail(new TicketCreationError(`Failed to create ticket with title: ${input.title}`))
              }),
            onSome: (ticket) =>
              Effect.gen(function* () {
                yield* Effect.logInfo(`✅ Successfully created ticket "${ticket.title}" with ID: ${ticket.id}`)
                return ticket
              }),
          })
        )
      })

    const findAll = (input: typeof FindAllTicketsInput.Type) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`📋 Finding root tickets (offset: ${input.offset}, limit: ${input.limit})`)
        return yield* Effect.flatMap(
          repository.findAll(input),
          Option.match({
            onNone: () =>
              Effect.gen(function* () {
                yield* Effect.logWarning(`📭 No root tickets found in database`)
                return yield* Effect.fail(new NoTicketsFoundError(`No tickets found`))
              }),
            onSome: (tickets) =>
              Effect.gen(function* () {
                yield* Effect.logInfo(`📋 Found ${tickets.length} root tickets`)
                return tickets
              }),
          })
        )
      }).pipe(Effect.flatMap((tickets) => Effect.forEach(tickets, (ticket) => helper.findChildrenBFS(ticket), { concurrency: 10 })))

    const deleteTicket = (id: TicketId) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`🗑️  Starting cascade delete for ticket ID: ${id}`)

        const ticket = yield* repository.findById(id).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () =>
                Effect.gen(function* () {
                  yield* Effect.logWarning(`❌ Ticket not found with ID ${id} for deletion`)
                  return yield* Effect.fail(new TicketNotFoundError(`Failed to find ticket with ID ${id}`))
                }),
              onSome: Effect.succeed,
            })
          )
        )

        const tree = yield* helper.findChildrenBFS(ticket)
        const allTickets = helper.flattenTree(tree)

        yield* Effect.logInfo(`🗑️  Found ${allTickets.length} tickets to delete in cascade`)

        const deletedIds = yield* Effect.forEach(
          allTickets,
          (ticket) =>
            Effect.gen(function* () {
              return yield* Effect.flatMap(
                repository.deleteTicket(ticket.id as TicketId),
                Option.match({
                  onNone: () => Effect.fail(new TicketNotFoundError(`Failed to delete ticket with ID ${ticket.id}`)),
                  onSome: (deleted) => Effect.succeed(deleted),
                })
              )
            }),
          { concurrency: 5 }
        )

        yield* Effect.logInfo(`✅ Cascade delete completed: ${deletedIds.length} tickets removed`)
        return deletedIds
      })

    const removeParentFromTicket = (id: TicketId) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`🔄 Checking parent removal for ticket ID: ${id}`)

        // First check if ticket exists and get current state
        const currentTicket = yield* repository.findById(id).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () =>
                Effect.gen(function* () {
                  yield* Effect.logWarning(`❌ Ticket not found with ID ${id} for parent removal`)
                  return yield* Effect.fail(new TicketNotFoundError(`Failed to find ticket with ID ${id}`))
                }),
              onSome: Effect.succeed,
            })
          )
        )

        // Check if ticket is already a root ticket
        if (currentTicket.parentId === null) {
          yield* Effect.logInfo(`ℹ️  Ticket "${currentTicket.title}" (ID: ${currentTicket.id}) is already a root ticket`)
          return currentTicket
        }

        // Remove parent
        const updatedTicket = yield* repository.removeParent(id).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () =>
                Effect.gen(function* () {
                  yield* Effect.logWarning(`❌ Failed to remove parent from ticket with ID ${id}`)
                  return yield* Effect.fail(new TicketNotFoundError(`Failed to remove parent from ticket with ID ${id}`))
                }),
              onSome: Effect.succeed,
            })
          )
        )

        yield* Effect.logInfo(
          `✅ Successfully removed parent from ticket "${updatedTicket.title}" (ID: ${updatedTicket.id}). Ticket is now a root ticket.`
        )
        return updatedTicket
      })

    return {
      findById,
      createTicket,
      findAll,
      deleteTicket,
      toggleTicket,
      removeParentFromTicket,
    } as const
  }),

  dependencies: [TicketRepository.Default, HelperService.Default],
}) {}

export const TicketServiceLive = TicketService.Default
