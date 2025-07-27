import { Effect, Option } from "effect"
import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite"
import { eq, isNull } from "drizzle-orm"
import { DatabaseLive } from "../../lib/db"
import { tickets } from "../ticket"
import { TicketId } from "./schema"
import { NoTicketsFoundError } from "../errors"

export class TicketRepository extends Effect.Service<TicketRepository>()("Ticket/Repo", {
  effect: Effect.gen(function* () {
    const db = yield* SqliteDrizzle.SqliteDrizzle

    const findById = (id: TicketId) => {
      return Effect.gen(function* () {
        const rowsResult = yield* db.select().from(tickets).where(eq(tickets.id, id))
        return Option.fromNullable(rowsResult[0])
      })
    }

    const createTicket = (title: string, description: string) => {
      return Effect.gen(function* () {
        const now = new Date()
        const result = yield* db
          .insert(tickets)
          .values({
            title,
            description,
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

    const findAll = (offset: number, limit: number) => {
      return Effect.gen(function* () {
        const result = yield* db.select().from(tickets).where(isNull(tickets.parentId)).limit(limit).offset(offset)
        if (result.length === 0) {
          return yield* Option.none()
        }
        return Option.some(result)
      })
    }

    return {
      findById,
      createTicket,
      deleteTicket,
      findAll,
    } as const
  }),
  dependencies: [DatabaseLive],
}) {}

export const TicketRepositoryLive = TicketRepository.Default
