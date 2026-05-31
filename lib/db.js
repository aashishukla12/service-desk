import pg from "pg";

const { Pool } = pg;

const globalForPg = globalThis;

function getPool() {
  if (globalForPg.serviceDeskPool) {
    return globalForPg.serviceDeskPool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is required. " +
      "Copy .env.example to .env and set your PostgreSQL connection string."
    );
  }

  const created = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPg.serviceDeskPool = created;
  }

  return created;
}

/** @type {import("pg").Pool} */
export const pool = new Proxy(/** @type {any} */ ({}), {
  get(_target, prop) {
    return getPool()[prop];
  }
});

export async function withClient(callback) {
  const client = await pool.connect();

  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

export async function withTransaction(callback) {
  return withClient(async (client) => {
    await client.query("BEGIN");

    try {
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
