import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page.ts";

const requestContextMiddleware = createMiddleware().server(async ({ next, request }) => {
  const { createRequestId, runWithRequestContext } = await import("./lib/request-context.ts");
  const { logger } = await import("./lib/logger.ts");

  const incoming = request.headers.get("x-request-id")?.trim();
  const requestId =
    incoming && /^[A-Za-z0-9._-]{8,128}$/.test(incoming) ? incoming : createRequestId();

  return runWithRequestContext(requestId, async () => {
    try {
      return await next();
    } catch (error) {
      if (error != null && typeof error === "object" && "statusCode" in error) {
        throw error;
      }
      logger.error("request.unhandled", { requestId, error });
      return new Response(renderErrorPage(), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "x-request-id": requestId,
          "x-content-type-options": "nosniff",
        },
      });
    }
  });
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => {
    const method = ctx.request.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") return false;
    return true;
  },
});

export const startInstance = createStart(() => ({
  requestMiddleware: [requestContextMiddleware, csrfMiddleware],
}));
