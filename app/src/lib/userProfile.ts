import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getDb } from "@/lib/db";

const db = getDb();

const selectByPhoneStmt = db.prepare<
  [string],
  {
    phone: string;
    password_hash: string;
    password_salt: string;
    created_at: string;
    updated_at: string;
  } | undefined
>(
  `SELECT phone, password_hash, password_salt, created_at, updated_at
   FROM user_profile
   WHERE phone = ?`
);

const insertStmt = db.prepare<
  [string, string, string, string, string]
>(
  `INSERT INTO user_profile (phone, password_hash, password_salt, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?)`
);

const updateStmt = db.prepare<
  [string, string, string, string]
>(
  `UPDATE user_profile 
   SET password_hash = ?, password_salt = ?, updated_at = ?
   WHERE phone = ?`
);

export function getUserProfileByPhone(phone: string) {
  return selectByPhoneStmt.get(phone);
}

function derivePassword(password: string, salt: string) {
  const hash = scryptSync(password, salt, 64);
  return hash.toString("hex");
}

export function createUserProfile(phone: string, password: string) {
  const now = new Date().toISOString();
  const salt = randomBytes(16).toString("hex");
  const hash = derivePassword(password, salt);
  
  try {
    insertStmt.run(phone, hash, salt, now, now);
    const profile = getUserProfileByPhone(phone);
    if (!profile) {
      throw new Error("未能在创建后读取用户信息");
    }
    return profile;
  } catch (error) {
    // 如果手机号已存在，更新密码
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      updateStmt.run(hash, salt, now, phone);
      const profile = getUserProfileByPhone(phone);
      if (!profile) {
        throw new Error("未能在更新后读取用户信息");
      }
      return profile;
    }
    throw error;
  }
}

// 保留旧函数名以兼容现有代码，但内部使用新的实现
export function bindPhoneToUser(phone: string, userId: string, password: string) {
  // 忽略userId参数，直接使用phone作为用户ID
  return createUserProfile(phone, password);
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
      // 返回包含phone字段的对象，保持向后兼容
      return {
        phone: profile.phone,
        user_id: profile.phone, // 使用phone作为user_id
        password_hash: profile.password_hash,
        password_salt: profile.password_salt,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      };
    }
    return null;
  } catch (error) {
    console.warn("密码校验失败", error);
    return null;
  }
}
