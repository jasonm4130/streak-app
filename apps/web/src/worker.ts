// apps/web/src/worker.ts
// Pure passthrough to the assets binding — no app logic in v1.
// Add /api/* routes here in future versions.

export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
