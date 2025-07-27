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

  // Level 1: Root tickets (no parent)
  const rootTickets = yield* db
    .insert(tickets)
    .values([
      {
        title: "Projekt A - Huvudprojekt",
        description: "Huvudprojekt för systemutveckling",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: null,
      },
      {
        title: "Projekt B - Underhåll",
        description: "Underhållsprojekt för befintligt system",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: null,
      },
      {
        title: "Projekt C - Ny funktionalitet",
        description: "Implementering av nya features",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: null,
      },
    ])
    .returning()

  // Level 2: Children of root tickets
  const level2Tickets = yield* db
    .insert(tickets)
    .values([
      {
        title: "Frontend Utveckling",
        description: "React/Vue.js implementation",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: rootTickets[0].id,
      },
      {
        title: "Backend API",
        description: "REST API development",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: rootTickets[0].id,
      },
      {
        title: "Database Design",
        description: "Schema och migrations",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: rootTickets[0].id,
      },
      {
        title: "Bug Fixes",
        description: "Kritiska buggar som behöver fixas",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: rootTickets[1].id,
      },
      {
        title: "Performance Optimization",
        description: "Förbättra systemets prestanda",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: rootTickets[1].id,
      },
      {
        title: "User Authentication",
        description: "Implementera login/logout",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: rootTickets[2].id,
      },
    ])
    .returning()

  // Level 3: Children of level 2 tickets
  const level3Tickets = yield* db
    .insert(tickets)
    .values([
      {
        title: "React Components",
        description: "Skapa återanvändbara komponenter",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level2Tickets[0].id,
      },
      {
        title: "State Management",
        description: "Redux/Zustand setup",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level2Tickets[0].id,
      },
      {
        title: "API Endpoints",
        description: "Skapa alla nödvändiga endpoints",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level2Tickets[1].id,
      },
      {
        title: "Database Migrations",
        description: "Skapa och köra migrations",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level2Tickets[2].id,
      },
      {
        title: "Critical Bug #1",
        description: "Login timeout issue",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level2Tickets[3].id,
      },
      {
        title: "Critical Bug #2",
        description: "Data loss på save",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level2Tickets[3].id,
      },
      {
        title: "Query Optimization",
        description: "Förbättra databas-queries",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level2Tickets[4].id,
      },
      {
        title: "JWT Implementation",
        description: "Token-baserad autentisering",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level2Tickets[5].id,
      },
    ])
    .returning()

  // Level 4: Children of level 3 tickets
  const level4Tickets = yield* db
    .insert(tickets)
    .values([
      {
        title: "Button Components",
        description: "Skapa standardiserade knappar",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level3Tickets[0].id,
      },
      {
        title: "Form Components",
        description: "Input och form validation",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level3Tickets[0].id,
      },
      {
        title: "Store Setup",
        description: "Konfigurera Redux store",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level3Tickets[1].id,
      },
      {
        title: "User Endpoints",
        description: "GET/POST /api/users",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level3Tickets[2].id,
      },
      {
        title: "Auth Endpoints",
        description: "POST /api/auth/login",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level3Tickets[2].id,
      },
      {
        title: "Initial Migration",
        description: "Skapa users tabell",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level3Tickets[3].id,
      },
      {
        title: "Fix Login Timeout",
        description: "Öka timeout från 30s till 5min",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level3Tickets[4].id,
      },
      {
        title: "Fix Data Loss",
        description: "Implementera auto-save",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level3Tickets[5].id,
      },
      {
        title: "Index Optimization",
        description: "Lägg till index på vanliga queries",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level3Tickets[6].id,
      },
      {
        title: "Token Generation",
        description: "Skapa JWT tokens",
        completed: false,
        createdAt: nowDate,
        updatedAt: nowDate,
        parentId: level3Tickets[7].id,
      },
    ])
    .returning()

  // Level 5: Final level - children of level 4 tickets
  yield* db.insert(tickets).values([
    {
      title: "Primary Button",
      description: "Blå huvudknapp",
      completed: false,
      createdAt: nowDate,
      updatedAt: nowDate,
      parentId: level4Tickets[0].id,
    },
    {
      title: "Secondary Button",
      description: "Grå sekundärknapp",
      completed: false,
      createdAt: nowDate,
      updatedAt: nowDate,
      parentId: level4Tickets[0].id,
    },
    {
      title: "Text Input",
      description: "Standard text input",
      completed: false,
      createdAt: nowDate,
      updatedAt: nowDate,
      parentId: level4Tickets[1].id,
    },
    {
      title: "Email Input",
      description: "Email validation input",
      completed: false,
      createdAt: nowDate,
      updatedAt: nowDate,
      parentId: level4Tickets[1].id,
    },
    {
      title: "User Actions",
      description: "Redux actions för users",
      completed: false,
      createdAt: nowDate,
      updatedAt: nowDate,
      parentId: level4Tickets[2].id,
    },
    {
      title: "User Reducers",
      description: "Redux reducers för users",
      completed: false,
      createdAt: nowDate,
      updatedAt: nowDate,
      parentId: level4Tickets[2].id,
    },
  ])

  yield* Effect.logInfo("Seeding completed! Created 20 tickets across 5 levels")
})

const AppLayer = Layer.mergeAll(SqlLive, DrizzleLive)
Effect.runPromise(seed.pipe(Effect.provide(AppLayer))).then(() => {
  process.exit(0)
})
