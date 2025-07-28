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

export const CreateTicketInput = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255), Schema.annotations({ description: "Ticket title" })),
  description: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(1000), Schema.annotations({ description: "Ticket description" })),
})

export const FindAllTicketsInput = Schema.Struct({
  offset: Schema.Number.pipe(Schema.nonNegative(), Schema.annotations({ description: "Offset" })),
  limit: Schema.Number.pipe(Schema.nonNegative(), Schema.annotations({ description: "Limit" })),
})

export const ToggleTicketInput = Schema.Struct({
  id: TicketIdSchema,
  isCompleted: Schema.Boolean.pipe(Schema.annotations({ description: "Is completed" })),
})

export const DeleteTicketInput = Schema.Struct({
  id: TicketIdSchema,
})

export const RemoveParentInput = Schema.Struct({
  id: TicketIdSchema,
})
