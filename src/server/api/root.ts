import { exampleRouter } from "~/server/api/routers/example"
import { checkoutRouter } from "~/server/api/routers/checkout"
import { generateRouter } from "~/server/api/routers/generate"
import { createTRPCRouter } from "~/server/api/trpc"

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  generate: generateRouter,
  example: exampleRouter,
  checkout: checkoutRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter;
