import { Effect, Option } from "effect"
import { TicketNotFoundError } from "../errors"
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

    return {
      findById,
    } as const
  }),
  dependencies: [TicketRepository.Default],
}) {}

export const TicketServiceLive = TicketService.Default
