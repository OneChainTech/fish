import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuid } from "uuid";

// 批量保存标点数据
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (!rawBody || rawBody.trim().length === 0) {
      return Response.json(
        { error: "请求体为空，需提供标记数据" },
        { status: 400 }
      );
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawBody) as Record<string, unknown>;
    } catch (parseError) {
      console.warn("批量标点请求体解析失败", parseError);
      return Response.json(
        { error: "请求体格式错误，需提供合法 JSON" },
        { status: 400 }
      );
    }

    const userId = typeof data.userId === "string" ? data.userId : null;
    const marks = Array.isArray(data.marks) ? data.marks : [];

    if (!userId) {
      return Response.json(
        { error: "请求需包含 userId" },
        { status: 400 }
      );
    }

    if (marks.length === 0) {
      return Response.json({ success: true, saved: 0 });
    }

    const now = new Date().toISOString();
    
    // 去重：按 fishId + address 组合去重
    const uniqueMarks = marks.reduce((acc: any[], mark: any) => {
      const key = `${mark.fishId}-${mark.address}`;
      if (!acc.find(item => `${item.fishId}-${item.address}` === key)) {
        acc.push(mark);
      }
      return acc;
    }, []);
    
    const batchData = uniqueMarks.map((mark: any) => ({
      id: uuid(),
      user_id: userId,
      fish_id: mark.fishId,
      address: mark.address,
      recorded_at: mark.recordedAt || now,
      created_at: now
    }));

    try {
      // 使用 upsert 避免重复键约束错误
      const { data: insertedData, error } = await supabase
        .from('user_marks')
        .upsert(batchData, {
          onConflict: 'user_id,fish_id,address'
        })
        .select();

      if (error) {
        throw error;
      }

      return Response.json({ 
        success: true, 
        saved: insertedData?.length || 0,
        marks: insertedData?.map(mark => ({
          id: mark.id,
          userId: mark.user_id,
          fishId: mark.fish_id,
          address: mark.address,
          recordedAt: mark.recorded_at
        })) || []
      });
    } catch (error) {
      console.error("批量保存标点数据失败", error);
      return Response.json({ error: "保存失败" }, { status: 500 });
    }
  } catch (error) {
    console.error("批量保存标点数据失败", error);
    return Response.json({ error: "保存失败" }, { status: 500 });
  }
}
