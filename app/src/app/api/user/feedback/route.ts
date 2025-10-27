import { NextRequest } from "next/server";
import {
  countUserFeedback,
  createUserFeedback,
  getUserFeedback,
  deleteUserFeedback,
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
  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error("解析反馈请求失败", error);
    return Response.json({ error: "请求格式错误" }, { status: 400 });
  }

  const userId = typeof (body as { userId?: unknown })?.userId === "string" ? (body as { userId: string }).userId : null;
  const content = validateContent((body as { content?: unknown })?.content);

  if (!userId) {
    return Response.json({ error: "缺少用户信息" }, { status: 400 });
  }

  if (!content) {
    return Response.json({ error: "反馈内容需为 1-300 字" }, { status: 400 });
  }

  try {
    const existingCount = await countUserFeedback(userId);
    if (existingCount >= 3) {
      return Response.json({ error: "您已提交 3 条反馈，请等待处理后再尝试。" }, { status: 400 });
    }

    const record = await createUserFeedback(userId, content);
    return Response.json({ success: true, record });
  } catch (error) {
    console.error("保存用户反馈失败", error);
    return Response.json({ error: "保存反馈失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const feedbackId = req.nextUrl.searchParams.get("feedbackId");

  if (!userId || !feedbackId) {
    return Response.json({ error: "缺少参数" }, { status: 400 });
  }

  try {
    await deleteUserFeedback(userId, feedbackId);
    return Response.json({ success: true });
  } catch (error) {
    console.error("删除反馈失败", error);
    return Response.json({ error: "删除反馈失败" }, { status: 500 });
  }
}
