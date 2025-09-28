#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { randomBytes, scryptSync } = require("crypto");
const Database = require("better-sqlite3");

function getDatabasePath() {
  const envPath = process.env.SQLITE_PATH;
  if (envPath && envPath.trim().length > 0) {
    return envPath;
  }

  if (process.env.NODE_ENV === "production") {
    return path.join("/tmp", "fish.db");
  }

  return path.join(process.cwd(), "var", "fish.db");
}

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function initializeSchema(db) {
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

function derivePassword(password, salt) {
  const hash = scryptSync(password, salt, 64);
  return hash.toString("hex");
}

function resetPassword(db, phone, password) {
  const selectStmt = db.prepare(
    `SELECT phone FROM user_profile WHERE phone = ?`
  );
  const profile = selectStmt.get(phone);

  const now = new Date().toISOString();
  const salt = randomBytes(16).toString("hex");
  const hash = derivePassword(password, salt);

  if (!profile) {
    const insertStmt = db.prepare(
      `INSERT INTO user_profile (phone, password_hash, password_salt, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    );
    const result = insertStmt.run(phone, hash, salt, now, now);
    if (result.changes !== 1) {
      throw new Error(`创建手机号 ${phone} 的用户失败`);
    }

    return { phone, updatedAt: now, created: true };
  }

  const updateStmt = db.prepare(
    `UPDATE user_profile SET password_hash = ?, password_salt = ?, updated_at = ? WHERE phone = ?`
  );
  const result = updateStmt.run(hash, salt, now, phone);
  if (result.changes !== 1) {
    throw new Error(`更新手机号 ${phone} 的密码失败`);
  }

  return { phone, updatedAt: now, created: false };
}

function main() {
  const [, , phoneArg, passwordArg] = process.argv;

  if (!phoneArg || !/^1\d{10}$/.test(phoneArg)) {
    console.error("请提供 11 位的手机号码");
    process.exit(1);
  }

  if (!passwordArg || passwordArg.length < 6) {
    console.error("请提供不少于 6 位的密码");
    process.exit(1);
  }

  const dbPath = getDatabasePath();
  ensureDirectoryExists(dbPath);

  const db = new Database(dbPath);
  initializeSchema(db);

  try {
    const result = resetPassword(db, phoneArg, passwordArg);
    if (result.created) {
      console.log(`已创建手机号 ${result.phone} 的新用户并设置密码，更新时间 ${result.updatedAt}`);
    } else {
      console.log(`已成功重置手机号 ${result.phone} 的密码，更新时间 ${result.updatedAt}`);
    }
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { resetPassword, derivePassword, getDatabasePath };
