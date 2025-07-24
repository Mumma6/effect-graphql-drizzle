import { Effect, Layer } from "effect"
import { tickets } from "../domain/ticket/model"
import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite"
import { DrizzleLive, SqlLive } from "../lib/db"
import { SqlClient } from "@effect/sql"

const seed = Effect.gen(function* () {
  const db = yield* SqliteDrizzle.SqliteDrizzle
  const sql = yield* SqlClient.SqlClient
  const nowDate = new Date()

  yield* sql`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      parentId INTEGER
    )
  `

  yield* db.insert(tickets).values([
    {
      title: "Första ticket",
      description: "Demo-ticket",
      completed: false,
      createdAt: nowDate,
      updatedAt: nowDate,
    },
    {
      title: "Andra ticket",
      description: "Test-ticket",
      completed: false,
      createdAt: nowDate,
      updatedAt: nowDate,
    },
  ])
  yield* Effect.logInfo("Seeding completed!")
})
const AppLayer = Layer.mergeAll(SqlLive, DrizzleLive)
Effect.runPromise(seed.pipe(Effect.provide(AppLayer))).then(() => {
  process.exit(0)
})
