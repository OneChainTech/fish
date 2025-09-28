import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import type { Database as DatabaseInstance } from "better-sqlite3";

const globalKey = Symbol.for("fish-app:sqlite");

type GlobalStore = {
  connection?: DatabaseInstance;
};

const globalStore = globalThis as typeof globalThis & { [globalKey]?: GlobalStore };

function initializeSchema(db: DatabaseInstance) {
  db.pragma("journal_mode = WAL");
  
  // 创建表结构
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT PRIMARY KEY,
      collected_fish_ids TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS user_profile (
      phone TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS user_marks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      fish_id TEXT NOT NULL,
      address TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, fish_id, address)
    );
    
    CREATE INDEX IF NOT EXISTS idx_user_marks_user_fish ON user_marks(user_id, fish_id);
  `);
}

function createConnection() {
  // 优先使用环境变量，否则使用临时目录
  const dbPath = process.env.SQLITE_PATH || 
    (process.env.NODE_ENV === 'production' 
      ? path.join('/tmp', 'fish.db')  // 生产环境使用/tmp目录
      : path.join(process.cwd(), "var", "fish.db"));  // 开发环境使用var目录
  
  const dir = path.dirname(dbPath);
  
  // 确保目录存在，如果创建失败则使用内存数据库
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    console.warn('无法创建数据库目录，使用内存数据库:', error);
    // 如果无法创建目录，使用内存数据库
    const db = new Database(':memory:');
    initializeSchema(db);
    return db;
  }

  try {
    const db = new Database(dbPath);
    initializeSchema(db);
    return db;
  } catch (error) {
    console.warn('无法创建文件数据库，使用内存数据库:', error);
    // 如果无法创建文件数据库，使用内存数据库
    const db = new Database(':memory:');
    initializeSchema(db);
    return db;
  }
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
