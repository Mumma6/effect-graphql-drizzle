import { Schema } from "@effect/schema"
import { Brand } from "effect"

export type TicketId = number & Brand.Brand<"TicketId">

export const TicketIdSchema = Schema.NumberFromString.pipe(
  Schema.int(),
  Schema.nonNegative(),
  Schema.brand("TicketId"),
  Schema.annotations({ description: "Ticket ID" })
)

export const FindTicketByIdInput = Schema.Struct({
  id: TicketIdSchema,
})
