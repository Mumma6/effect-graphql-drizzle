import { Effect } from "effect/index"

export const errorResponse = (message: string) => Effect.succeed({ success: false, message })
export const successResponse = <T>(data: T) => Effect.succeed({ success: true, data })
