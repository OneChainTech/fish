import { NextRequest } from "next/server";
import { getCollectedFishIds, saveCollectedFishIds } from "@/lib/progress";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return Response.json({ error: "缺少 userId 参数" }, { status: 400 });
  }

  const collected = getCollectedFishIds(userId);

  return Response.json({ collectedFishIds: collected });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const userId = data?.userId;
    const collectedFishIds = Array.isArray(data?.collectedFishIds)
      ? (data.collectedFishIds as string[])
      : null;

    if (!userId || !collectedFishIds) {
      return Response.json(
        { error: "请求需包含 userId 与 collectedFishIds[]" },
        { status: 400 }
      );
    }

    const sanitized = Array.from(
      new Set(collectedFishIds.filter((item: string) => typeof item === "string" && item.trim().length > 0))
    );

    const payload = JSON.stringify(sanitized);
    const now = new Date().toISOString();

    saveCollectedFishIds(userId, payload, now);

    return Response.json({ success: true });
  } catch (error) {
    console.error("更新用户进度失败", error);
    return Response.json({ error: "更新失败" }, { status: 500 });
  }
}
