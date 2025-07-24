import { Data } from "effect"

export class TicketNotFoundError extends Data.TaggedError("TicketNotFoundError")<{}> {
  constructor(readonly message: string = "Ticket not found") {
    super()
  }
}
