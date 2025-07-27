import { Effect } from "effect/index"

export const errorResponse = (message: string) => Effect.succeed({ success: false, message, data: null })
export const successResponse = <T>(data: T, message: string) => Effect.succeed({ success: true, data, message })
