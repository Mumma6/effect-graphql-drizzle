import { Effect, Option } from "effect"
import { NoTicketsFoundError, TicketCreationError, TicketNotFoundError } from "../errors"
import { TicketId } from "./schema"
import { TicketRepository } from "./repository"

export class TicketService extends Effect.Service<TicketService>()("Ticket/Service", {
  effect: Effect.gen(function* () {
    const repository = yield* TicketRepository

    const findById = (id: TicketId) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`Looking for ticket with ID: ${id}`)

        return yield* Effect.flatMap(
          repository.findById(id),
          Option.match({
            onNone: () =>
              Effect.gen(function* () {
                yield* Effect.logWarning(`No ticket found with ID ${id}`)
                return yield* Effect.fail(new TicketNotFoundError(`Failed to find ticket with ID ${id}`))
              }),
            onSome: (ticket) =>
              Effect.gen(function* () {
                yield* Effect.logInfo(`Found ticket with ID ${ticket.id}`)
                return ticket
              }),
          })
        )
      })

    const createTicket = (input: { title: string; description: string }) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`Creating ticket with title: ${input.title}`)

        return yield* Effect.flatMap(
          repository.createTicket(input.title, input.description),
          Option.match({
            onNone: () =>
              Effect.gen(function* () {
                yield* Effect.logWarning(`Failed to create ticket with title: ${input.title}`)
                return yield* Effect.fail(new TicketCreationError(`Failed to create ticket with title: ${input.title}`))
              }),
            onSome: (ticket) =>
              Effect.gen(function* () {
                yield* Effect.logInfo(`Created ticket with ID ${ticket.id}`)
                return ticket
              }),
          })
        )
      })

    const findAll = (offset: number, limit: number) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`Finding all tickets with offset: ${offset} and limit: ${limit}`)
        return yield* Effect.flatMap(
          repository.findAll(offset, limit),
          Option.match({
            onNone: () =>
              Effect.gen(function* () {
                yield* Effect.logWarning(`No tickets found`)
                return yield* Effect.fail(new NoTicketsFoundError(`No tickets found`))
              }),
            onSome: (tickets) =>
              Effect.gen(function* () {
                yield* Effect.logInfo(`Found ${tickets.length} tickets`)
                return tickets
              }),
          })
        )
      })

    const deleteTicket = (id: TicketId) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`Deleting ticket with ID: ${id}`)
        const ticket = yield* findById(id)
        const isParent = ticket.parentId === null
        // if its a parent, delete all children
        const result = yield* repository.deleteTicket(id)
        return result
      })

    return {
      findById,
      createTicket,
      findAll,
      deleteTicket,
    } as const
  }),

  dependencies: [TicketRepository.Default],
}) {}

export const TicketServiceLive = TicketService.Default
