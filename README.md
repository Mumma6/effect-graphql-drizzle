# Effect + Apollo GraphQL + Drizzle Demo

This project demonstrates how to build a robust, type-safe backend using [Effect](https://effect.website/), [Apollo GraphQL](https://www.apollographql.com/docs/apollo-server/), and [Drizzle ORM](https://orm.drizzle.team/).

## Features
- Functional, effectful business logic with [Effect](https://effect.website/)
- Type-safe database access with [Drizzle ORM](https://orm.drizzle.team/)
- GraphQL API with [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- SQLite as the database (file-based, easy for demos)
- Robust error handling, logging, and separation of concerns
- Branded types for type-safe IDs (see `domain/ticket/schema.ts`)

## Project Structure

- `domain/` - **All business logic, models, schemas, errors, and branded types.**
  - `ticket/model.ts` - Drizzle table definition for tickets.
  - `ticket/schema.ts` - Input validation schemas, including a branded `TicketId` type for type-safe IDs.
  - `ticket/service.ts` - Business logic (e.g., finding, creating tickets).
  - `ticket/repository.ts` - Database access functions.
  - `errors.ts` - Domain-specific error types.
- `lib/` - **Database setup and utilities.**
  - `db.ts` - Sets up the SQLite/Drizzle/Effect database connection and layers.
  - `utils.ts` - Response helpers for GraphQL (e.g., `successResponse`, `errorResponse`).
- `scripts/` - **Utility scripts.**
  - `seed.ts` - Seeds the database with demo data and creates the table if needed.
- `graphql/` - **GraphQL schema and resolvers.**
  - `schema/typeDefs.ts` - GraphQL SDL schema (types, queries, mutations).
  - `resolvers/index.ts` - GraphQL resolvers. **This is where all error handling, retries, timeouts, and mapping from domain/service results to GraphQL responses happens.** The resolver layer is responsible for API robustness: it catches and logs errors, applies retry policies, handles timeouts, and translates domain/service errors into GraphQL-friendly responses.
- `server.ts` - **App entrypoint.** Sets up ApolloServer, checks DB/table existence, and starts the API.

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Seed the database:**
   ```sh
   npm run seed
   ```
3. **Start the server:**
   ```sh
   npm run dev
   ```

## Resetting the Database

To delete the database file and reseed:
```sh
npm run db:reset
```

## Tech Stack
- [Effect](https://effect.website/) (functional effects, error handling, dependency injection)
- [Drizzle ORM](https://orm.drizzle.team/) (type-safe SQL for SQLite)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) (GraphQL API)
- [SQLite](https://www.sqlite.org/index.html) (file-based database)
- TypeScript


This demo is intended as a clear, idiomatic example of how to combine Effect, Drizzle, and Apollo GraphQL for robust, type-safe backend development. 