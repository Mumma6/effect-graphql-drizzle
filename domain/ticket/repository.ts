import { Effect, Option } from "effect"
import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite"
import { eq, isNull } from "drizzle-orm"
import { DatabaseLive } from "../../lib/db"
import { tickets } from "../ticket"
import { CreateTicketInput, FindAllTicketsInput, TicketId, ToggleTicketInput } from "./schema"

export class TicketRepository extends Effect.Service<TicketRepository>()("Ticket/Repo", {
  effect: Effect.gen(function* () {
    const db = yield* SqliteDrizzle.SqliteDrizzle

    const findById = (id: TicketId) => {
      return Effect.gen(function* () {
        const rowsResult = yield* db.select().from(tickets).where(eq(tickets.id, id))
        return Option.fromNullable(rowsResult[0])
      })
    }

    const findChildren = (id: TicketId) => {
      return Effect.gen(function* () {
        const rowsResult = yield* db.select().from(tickets).where(eq(tickets.parentId, id))
        return Option.fromNullable(rowsResult)
      })
    }

    const createTicket = (input: typeof CreateTicketInput.Type) => {
      return Effect.gen(function* () {
        const now = new Date()
        const result = yield* db
          .insert(tickets)
          .values({
            title: input.title,
            description: input.description,
            completed: false,
            createdAt: now,
            updatedAt: now,
            parentId: null,
          })
          .returning()
        return Option.fromNullable(result[0])
      })
    }

    const deleteTicket = (id: TicketId) => {
      return Effect.gen(function* () {
        const result = yield* db.delete(tickets).where(eq(tickets.id, id)).returning({ deletedId: tickets.id })
        return Option.fromNullable(result[0])
      })
    }

    const findAll = (input: typeof FindAllTicketsInput.Type) => {
      return Effect.gen(function* () {
        const result = yield* db.select().from(tickets).where(isNull(tickets.parentId)).limit(input.limit).offset(input.offset)
        if (result.length === 0) {
          return yield* Option.none()
        }
        return Option.some(result)
      })
    }

    const toggleTicket = (input: typeof ToggleTicketInput.Type) => {
      return Effect.gen(function* () {
        const result = yield* db.update(tickets).set({ completed: input.isCompleted }).where(eq(tickets.id, input.id)).returning()
        return Option.fromNullable(result[0])
      })
    }

    return {
      findById,
      createTicket,
      deleteTicket,
      findAll,
      toggleTicket,
      findChildren,
    } as const
  }),
  dependencies: [DatabaseLive],
}) {}

export const TicketRepositoryLive = TicketRepository.Default
