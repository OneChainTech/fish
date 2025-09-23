import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import type { Database as DatabaseInstance } from "better-sqlite3";

const globalKey = Symbol.for("fish-app:sqlite");

type GlobalStore = {
  connection?: DatabaseInstance;
};

const globalStore = globalThis as typeof globalThis & { [globalKey]?: GlobalStore };

function createConnection() {
  const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), "var", "fish.db");
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT PRIMARY KEY,
      collected_fish_ids TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  return db;
}

export function getDb() {
  if (!globalStore[globalKey]) {
    globalStore[globalKey] = {};
  }

  if (!globalStore[globalKey]!.connection) {
    globalStore[globalKey]!.connection = createConnection();
  }

  return globalStore[globalKey]!.connection!;
}
