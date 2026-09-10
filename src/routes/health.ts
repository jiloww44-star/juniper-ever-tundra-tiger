import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: async () => {
        const payload = {
          status: "ok",
          timestamp: new Date().toISOString(),
          ai: Boolean(process.env.XAI_API_KEY),
        };
        return Response.json(payload, {
          headers: {
            "cache-control": "no-store",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
