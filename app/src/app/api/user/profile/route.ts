import { NextRequest } from "next/server";
import {
  createUserProfile,
  verifyPhoneCredentials,
  getUserProfileByPhone,
} from "@/lib/userProfile";
import { getCollectedFishIds } from "@/lib/progress";

function normalizePhone(input: unknown) {
  if (typeof input !== "string") return null;
  const digits = input.replace(/\D/g, "");
  return /^1\d{10}$/.test(digits) ? digits : null;
}

// 登录API
export async function GET(req: NextRequest) {
  const phoneParam = req.nextUrl.searchParams.get("phone");
  const passwordParam = req.nextUrl.searchParams.get("password");
  const phone = normalizePhone(phoneParam ?? "");
  const password = typeof passwordParam === "string" ? passwordParam : "";

  if (!phone || password.length < 6) {
    return Response.json({ error: "请提供有效的手机号与密码" }, { status: 400 });
  }

  const profile = verifyPhoneCredentials(phone, password);
  if (!profile) {
    return Response.json({ error: "手机号或密码不正确" }, { status: 401 });
  }

  const collectedFishIds = getCollectedFishIds(profile.user_id);

  return Response.json({
    phone: profile.phone,
    userId: profile.user_id,
    collectedFishIds,
  });
}

// 注册API
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const phone = normalizePhone(data?.phone);
    const password = typeof data?.password === "string" ? data.password : "";
    if (!phone || password.length < 6) {
      return Response.json(
        { error: "请求需包含有效的手机号与不少于 6 位的密码" },
        { status: 400 }
      );
    }

    // 检查手机号是否已注册
    const existingProfile = getUserProfileByPhone(phone);
    if (existingProfile) {
      return Response.json({ error: "该手机号已注册，请直接登录" }, { status: 409 });
    }

    // 创建新用户
    const profile = createUserProfile(phone, password);

    return Response.json({
      phone: profile.phone,
      userId: profile.phone, // 使用手机号作为用户ID
      collectedFishIds: [],
    });
  } catch (error) {
    console.error("注册失败", error);
    return Response.json({ error: "注册失败" }, { status: 500 });
  }
}
