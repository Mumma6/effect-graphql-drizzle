import * as D from "drizzle-orm/sqlite-core"
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core"

export const tickets = D.sqliteTable("tickets", {
  id: D.integer("id").primaryKey({ autoIncrement: true }),
  title: D.text("title").notNull(),
  description: D.text("description").notNull(),
  completed: D.integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: D.integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: D.integer("updatedAt", { mode: "timestamp" }).notNull(),
  parentId: D.integer("parentId").references((): AnySQLiteColumn => tickets.id),
})

export type Ticket = typeof tickets.$inferSelect

export type TicketWithChildren = Ticket & {
  children: TicketWithChildren[]
}
