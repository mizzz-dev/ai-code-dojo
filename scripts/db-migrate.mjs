import { runMigrations, getDbPath } from '../apps/api/src/db/database.mjs';

const dbPath = runMigrations();
console.log(`DB migration completed: ${dbPath || getDbPath()}`);
