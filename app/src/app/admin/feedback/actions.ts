"use server";

import { revalidatePath } from "next/cache";
import { ensureAdminAuthenticated } from "@/lib/admin-auth.server";
import { replyUserFeedback } from "@/lib/feedback-supabase";

export async function respondToFeedback(formData: FormData): Promise<void> {
  await ensureAdminAuthenticated();

  const id = formData.get("feedbackId");
  const reply = formData.get("reply");

  if (typeof id !== "string" || id.trim().length === 0) {
    console.error("缺少反馈ID");
    return;
  }

  if (typeof reply !== "string" || reply.trim().length === 0) {
    console.error("请填写回复内容");
    return;
  }

  const content = reply.trim();

  try {
    await replyUserFeedback(id, content);
  } catch (error) {
    console.error("管理员回复反馈失败", error);
    return;
  }

  revalidatePath("/admin/feedback");
  revalidatePath("/admin/monitor");
}
