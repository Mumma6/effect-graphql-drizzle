import { describe, it, expect, vi } from "vitest"
import { Effect, Option, Layer } from "effect"
import { TicketId, TicketService } from "../domain/ticket"
import { TicketNotFoundError } from "../domain/errors"

const DefaultServiceMockImplementation = {
  findById: vi.fn().mockReturnValue(Effect.succeed(Option.none())),
  createTicket: vi.fn().mockReturnValue(Effect.succeed(null)),
  deleteTicket: vi.fn().mockReturnValue(Effect.succeed(Option.none())),
  findAll: vi.fn().mockReturnValue(Effect.succeed(Option.none())),
  toggleTicket: vi.fn().mockReturnValue(Effect.succeed(Option.none())),
}

describe("TicketService", () => {
  describe("findById", () => {
    it("should find a ticket by id", async () => {
      const TicketServiceMock = new TicketService({
        ...DefaultServiceMockImplementation,
        findById: vi.fn().mockReturnValue(
          Effect.succeed({
            id: 1 as TicketId,
            title: "Test Ticket",
            description: "Test Description",
            parentId: null,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        ),
      })

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const ticketService = yield* TicketService
          const ticket = yield* ticketService.findById(1 as TicketId)
          return ticket
        }).pipe(Effect.provide(Layer.succeed(TicketService, TicketServiceMock)))
      )

      expect(result.title).toBe("Test Ticket")
      expect(TicketServiceMock.findById).toHaveBeenCalledWith(1)
    })
  })
})
