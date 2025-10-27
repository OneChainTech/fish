import { v4 as uuid } from "uuid";
import { supabase } from "@/lib/supabase";

export type FeedbackRecord = {
  id: string;
  user_id: string;
  content: string;
  reply_content: string | null;
  created_at: string;
  replied_at: string | null;
};

export async function createUserFeedback(
  userId: string,
  content: string,
): Promise<FeedbackRecord | null> {
  const now = new Date().toISOString();
  const payload = {
    id: uuid(),
    user_id: userId,
    content,
    created_at: now,
    reply_content: null as string | null,
    replied_at: null as string | null,
  };

  const { data, error } = await supabase
    .from("user_feedback")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("保存用户反馈失败", error);
    throw error;
  }

  return data as FeedbackRecord;
}

export async function getUserFeedback(userId: string): Promise<FeedbackRecord[]> {
  const { data, error } = await supabase
    .from("user_feedback")
    .select("id, user_id, content, reply_content, created_at, replied_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取用户反馈失败", error);
    throw error;
  }

  return (data as FeedbackRecord[]) ?? [];
}

export async function getAllFeedback(): Promise<FeedbackRecord[]> {
  const { data, error } = await supabase
    .from("user_feedback")
    .select("id, user_id, content, reply_content, created_at, replied_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取全部用户反馈失败", error);
    throw error;
  }

  return (data as FeedbackRecord[]) ?? [];
}

export async function replyUserFeedback(id: string, reply: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_feedback")
    .update({ reply_content: reply, replied_at: now })
    .eq("id", id);

  if (error) {
    console.error("回复用户反馈失败", error);
    throw error;
  }
}
