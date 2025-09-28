import { getDb } from "@/lib/db";

export class UserProfileAlreadyExistsError extends Error {
  constructor(phone: string) {
    super(`手机号 ${phone} 已存在`);
    this.name = "UserProfileAlreadyExistsError";
  }
}

const db = getDb();

const selectByPhoneStmt = db.prepare<
  [string],
  {
    phone: string;
    password: string;
    created_at: string;
    updated_at: string;
  } | undefined
>(
  `SELECT phone, password, created_at, updated_at
   FROM user_profile
   WHERE phone = ?`
);

const insertStmt = db.prepare<
  [string, string, string, string]
>(
  `INSERT INTO user_profile (phone, password, created_at, updated_at)
   VALUES (?, ?, ?, ?)`
);

export function getUserProfileByPhone(phone: string) {
  return selectByPhoneStmt.get(phone);
}

export function createUserProfile(phone: string, password: string) {
  const now = new Date().toISOString();

  try {
    insertStmt.run(phone, password, now, now);
    const profile = getUserProfileByPhone(phone);
    if (!profile) {
      throw new Error("未能在创建后读取用户信息");
    }
    return profile;
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      throw new UserProfileAlreadyExistsError(phone);
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
  if (!profile) {
    return null;
  }

  if (profile.password !== password) {
    return null;
  }

  // 返回包含phone字段的对象，保持向后兼容
  return {
    phone: profile.phone,
    user_id: profile.phone, // 使用phone作为user_id
    password: profile.password,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  };
}
