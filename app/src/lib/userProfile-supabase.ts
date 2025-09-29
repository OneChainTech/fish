import { supabase, type UserProfile } from "@/lib/supabase";

export class UserProfileAlreadyExistsError extends Error {
  constructor(phone: string) {
    super(`手机号 ${phone} 已存在`);
    this.name = "UserProfileAlreadyExistsError";
  }
}

export async function getUserProfileByPhone(phone: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profile')
      .select('phone, password, created_at, updated_at')
      .eq('phone', phone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

export async function createUserProfile(phone: string, password: string): Promise<UserProfile> {
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('user_profile')
      .insert({
        phone,
        password,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // 唯一约束冲突
        throw new UserProfileAlreadyExistsError(phone);
      }
      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof UserProfileAlreadyExistsError) {
      throw error;
    }
    console.error('创建用户失败:', error);
    throw error;
  }
}

// 保留旧函数名以兼容现有代码，但内部使用新的实现
export async function bindPhoneToUser(phone: string, userId: string, password: string): Promise<UserProfile> {
  // 忽略userId参数，直接使用phone作为用户ID
  return createUserProfile(phone, password);
}

export async function verifyPhoneCredentials(phone: string, password: string): Promise<{
  phone: string;
  user_id: string;
  password: string;
  created_at: string;
  updated_at: string;
} | null> {
  const profile = await getUserProfileByPhone(phone);
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
