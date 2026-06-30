/** Stub for OpenNext/Wrangler bundle — Postgres DDL runs locally or via scripts only. */
export class Client {
  constructor() {
    throw new Error("pg is not available on Cloudflare Workers");
  }
}

export default { Client };
