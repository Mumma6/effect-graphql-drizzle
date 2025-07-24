import { Effect, Option } from "effect"
import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite"
import { eq } from "drizzle-orm"
import { DatabaseLive } from "../../lib/db"
import { tickets } from "../ticket"
import { TicketId } from "./schema"

export class TicketRepository extends Effect.Service<TicketRepository>()("Ticket/Repo", {
  effect: Effect.gen(function* () {
    const db = yield* SqliteDrizzle.SqliteDrizzle

    const findById = (id: TicketId) => {
      return Effect.gen(function* () {
        const rowsResult = yield* db.select().from(tickets).where(eq(tickets.id, id))

        return Option.fromNullable(rowsResult[0])
      })
    }

    return {
      findById,
    } as const
  }),
  dependencies: [DatabaseLive],
}) {}

export const TicketRepositoryLive = TicketRepository.Default
