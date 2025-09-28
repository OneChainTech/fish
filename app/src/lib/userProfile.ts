import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db";

const db = getDb();

const selectByPhoneStmt = db.prepare<
  [string],
  {
    id: string;
    phone: string;
    user_id: string;
    password_hash: string | null;
    password_salt: string | null;
    created_at: string;
    updated_at: string;
  } | undefined
>(
  `SELECT id, phone, user_id, password_hash, password_salt, created_at, updated_at
   FROM user_profile
   WHERE phone = ?`
);

const upsertStmt = db.prepare<
  [string, string, string, string, string, string, string]
>(
  `INSERT INTO user_profile (id, phone, user_id, password_hash, password_salt, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(phone) DO UPDATE SET
     user_id = excluded.user_id,
     password_hash = excluded.password_hash,
     password_salt = excluded.password_salt,
     updated_at = excluded.updated_at`
);

export function getUserProfileByPhone(phone: string) {
  return selectByPhoneStmt.get(phone);
}

function derivePassword(password: string, salt: string) {
  const hash = scryptSync(password, salt, 64);
  return hash.toString("hex");
}

export function bindPhoneToUser(phone: string, userId: string, password: string) {
  const now = new Date().toISOString();
  const id = uuid();
  const salt = randomBytes(16).toString("hex");
  const hash = derivePassword(password, salt);
  upsertStmt.run(id, phone, userId, hash, salt, now, now);
  const profile = getUserProfileByPhone(phone);
  if (!profile) {
    throw new Error("未能在绑定后读取用户信息");
  }
  return profile;
}

export function verifyPhoneCredentials(phone: string, password: string) {
  const profile = getUserProfileByPhone(phone);
  if (!profile?.password_hash || !profile?.password_salt) {
    return null;
  }

  try {
    const computed = Buffer.from(derivePassword(password, profile.password_salt), "hex");
    const stored = Buffer.from(profile.password_hash, "hex");
    if (computed.length !== stored.length) {
      return null;
    }
    if (timingSafeEqual(computed, stored)) {
      return profile;
    }
    return null;
  } catch (error) {
    console.warn("密码校验失败", error);
    return null;
  }
}
