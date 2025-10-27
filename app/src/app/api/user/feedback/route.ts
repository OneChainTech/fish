import { NextRequest } from "next/server";
import {
  createUserFeedback,
  getUserFeedback,
} from "@/lib/feedback-supabase";

function validateContent(content: unknown): string | null {
  if (typeof content !== "string") return null;
  const trimmed = content.trim();
  if (!trimmed) return null;
  if (trimmed.length > 300) return null;
  return trimmed;
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "缺少 userId" }, { status: 400 });
  }

  try {
    const records = await getUserFeedback(userId);
    return Response.json({ feedback: records });
  } catch (error) {
    console.error("获取用户反馈记录失败", error);
    return Response.json({ error: "获取反馈失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = typeof body?.userId === "string" ? body.userId : null;
    const content = validateContent(body?.content);

    if (!userId) {
      return Response.json({ error: "缺少用户信息" }, { status: 400 });
    }

    if (!content) {
      return Response.json({ error: "反馈内容需为 1-300 字" }, { status: 400 });
    }

    try {
      const record = await createUserFeedback(userId, content);
      return Response.json({ success: true, record });
    } catch (error) {
      console.error("保存用户反馈失败", error);
      return Response.json({ error: "保存反馈失败" }, { status: 500 });
    }
  } catch (error) {
    console.error("解析反馈请求失败", error);
    return Response.json({ error: "请求格式错误" }, { status: 400 });
  }
}
