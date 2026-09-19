import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://campus:campus_secret@localhost:5432/campus_db";

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
