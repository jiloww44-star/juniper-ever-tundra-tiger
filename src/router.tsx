import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import KineticDotsLoader from "@/components/KineticDotsLoader";
import { AppErrorComponent } from "@/lib/error-component";

export function getRouter() {
  const queryClient = new QueryClient();

  return createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: AppErrorComponent,
    defaultPendingComponent: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <KineticDotsLoader label="Loading page" />
      </div>
    ),
    defaultPendingMs: 120,
    defaultPendingMinMs: 200,
  });
}
