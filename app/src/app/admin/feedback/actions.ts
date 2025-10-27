"use server";

import { revalidatePath } from "next/cache";
import { ensureAdminAuthenticated } from "@/lib/admin-auth.server";
import { replyUserFeedback } from "@/lib/feedback-supabase";

export async function respondToFeedback(formData: FormData) {
  await ensureAdminAuthenticated();

  const id = formData.get("feedbackId");
  const reply = formData.get("reply");

  if (typeof id !== "string" || id.trim().length === 0) {
    return { error: "缺少反馈ID" };
  }

  if (typeof reply !== "string" || reply.trim().length === 0) {
    return { error: "请填写回复内容" };
  }

  const content = reply.trim();

  try {
    await replyUserFeedback(id, content);
  } catch (error) {
    console.error("管理员回复反馈失败", error);
    return { error: "回复失败" };
  }

  revalidatePath("/admin/feedback");
  return { success: true };
}
