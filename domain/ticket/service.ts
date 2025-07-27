import { Effect, Option } from "effect"
import { NoTicketsFoundError, TicketCreationError, TicketNotFoundError } from "../errors"
import { FindAllTicketsInput, TicketId, ToggleTicketInput } from "./schema"
import { TicketRepository } from "./repository"
import { CreateTicketInput } from "./schema"
import { Ticket } from "./model"

export class TicketService extends Effect.Service<TicketService>()("Ticket/Service", {
  effect: Effect.gen(function* () {
    const repository = yield* TicketRepository

    const findChildren = (ticket: Ticket) =>
      Effect.flatMap(
        repository.findChildren(ticket.id as TicketId),
        Option.match({
          onNone: () =>
            Effect.gen(function* () {
              yield* Effect.logInfo(`No children found for ticket with ID ${ticket.id}`)
              return yield* Effect.succeed({ ...ticket, children: [] })
            }),
          onSome: (children) =>
            Effect.gen(function* () {
              yield* Effect.logInfo(`Found ${children.length} children for ticket with ID ${ticket.id}`)
              return yield* Effect.succeed({ ...ticket, children })
            }),
        })
      )

    const toggleTicket = (input: typeof ToggleTicketInput.Type) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`Toggling ticket with ID: ${input.id} to ${input.isCompleted}`)

        return yield* Effect.flatMap(
          repository.toggleTicket(input),
          Option.match({
            onNone: () =>
              Effect.gen(function* () {
                yield* Effect.logWarning(`No ticket found with ID ${input.id}`)
                return yield* Effect.fail(new TicketNotFoundError(`Failed to toggle ticket with ID ${input.id}`))
              }),
            onSome: (ticket) =>
              Effect.gen(function* () {
                yield* Effect.logInfo(`Toggled ticket with ID ${ticket.id} to ${ticket.completed}`)
                return ticket
              }),
          })
        )
      }).pipe(Effect.flatMap((ticket) => findChildren(ticket)))

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
        ).pipe(Effect.flatMap((ticket) => findChildren(ticket)))
      })

    const createTicket = (input: typeof CreateTicketInput.Type) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`Creating ticket with title: ${input.title}`)

        return yield* Effect.flatMap(
          repository.createTicket(input),
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

    const findAll = (input: typeof FindAllTicketsInput.Type) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`Finding all tickets with offset: ${input.offset} and limit: ${input.limit}`)
        return yield* Effect.flatMap(
          repository.findAll(input),
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
      }).pipe(Effect.flatMap((tickets) => Effect.forEach(tickets, (ticket) => findChildren(ticket), { concurrency: 10 })))

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
      toggleTicket,
    } as const
  }),

  dependencies: [TicketRepository.Default],
}) {}

export const TicketServiceLive = TicketService.Default
