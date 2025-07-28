import { Effect, Option, Queue } from "effect"
import { TicketId } from "./schema"
import { TicketRepository } from "./repository"
import { Ticket, TicketWithChildren } from "./model"

export class HelperService extends Effect.Service<HelperService>()("Ticket/Helper", {
  effect: Effect.gen(function* () {
    const repository = yield* TicketRepository

    const getChildCount = (ticket: TicketWithChildren): number => {
      const loop = (queue: TicketWithChildren[], acc: number): number => {
        if (queue.length === 0) {
          return acc
        }
        const [current, ...rest] = queue
        const children = current.children

        return loop([...rest, ...children], acc + children.length)
      }

      return loop([ticket], 0)
    }

    const getMaybeChildren = (ticket: Ticket) =>
      Effect.flatMap(
        repository.findChildren(ticket.id as TicketId),
        Option.match({
          onNone: () => Effect.succeed<TicketWithChildren>({ ...ticket, children: [] }),
          onSome: (children) => Effect.succeed<TicketWithChildren>({ ...ticket, children: children as TicketWithChildren[] }),
        })
      )

    /**
     * Traverses the ticket tree using Breadth-First Search (BFS) to enrich each node with its children.
     * This avoids deep recursion and builds a fully nested tree from the root down to a max depth.
     *
     * - Starts with a root ticket.
     * - Uses a queue to process each level of children.
     * - For each ticket, fetches children and adds them to the queue.
     * - Stops when no more children are found or max depth is reached.
     *
     */
    const findChildrenBFS = (rootTicket: Ticket, maxDepth = 10) =>
      Effect.gen(function* () {
        const queue = yield* Queue.unbounded<TicketWithChildren>()
        const withChildren = yield* getMaybeChildren(rootTicket)
        yield* Queue.offer(queue, withChildren)

        let depth = 0

        while (depth++ < maxDepth) {
          const currentLevel = yield* Queue.takeUpTo(queue, 100)

          for (const ticket of currentLevel) {
            if (ticket.children.length > 0) {
              for (const child of ticket.children) {
                const enriched = yield* getMaybeChildren(child)
                yield* Queue.offer(queue, enriched)
                ticket.children = ticket.children.map((child) => (child.id === enriched.id ? enriched : child))
              }
            }
          }

          if (currentLevel.length === 0) {
            break
          }
        }

        return withChildren
      })

    const flattenTree = (node: TicketWithChildren): Ticket[] => {
      return [node, ...node.children.flatMap(flattenTree)]
    }

    return {
      findChildrenBFS,
      flattenTree,
      getChildCount,
    } as const
  }),

  dependencies: [TicketRepository.Default],
}) {}

export const HelperServiceLive = HelperService.Default
