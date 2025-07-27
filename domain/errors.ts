import { Data } from "effect"

export class TicketNotFoundError extends Data.TaggedError("TicketNotFoundError")<{}> {
  constructor(readonly message: string = "Ticket not found") {
    super()
  }
}

export class TicketCreationError extends Data.TaggedError("TicketCreationError")<{}> {
  constructor(readonly message: string = "Ticket creation failed") {
    super()
  }
}

export class NoTicketsFoundError extends Data.TaggedError("NoTicketsFoundError")<{}> {
  constructor(readonly message: string = "No tickets found") {
    super()
  }
}
