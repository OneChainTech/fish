// 迁移到 Supabase - 重新导出 Supabase 版本的函数
export {
  UserProfileAlreadyExistsError,
  getUserProfileByPhone,
  createUserProfile,
  bindPhoneToUser,
  verifyPhoneCredentials
} from './userProfile-supabase';
