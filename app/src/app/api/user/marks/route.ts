import { NextRequest } from "next/server";
import { supabase, type UserMark } from "@/lib/supabase";
import { v4 as uuid } from "uuid";

// 获取用户的标点数据
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const fishId = req.nextUrl.searchParams.get("fishId");
  
  if (!userId) {
    return Response.json({ error: "缺少 userId 参数" }, { status: 400 });
  }

  try {
    let query = supabase
      .from('user_marks')
      .select('id, user_id, fish_id, address, recorded_at, created_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false });
    
    if (fishId) {
      query = query.eq('fish_id', fishId);
    }
    
    const { data: marks, error } = await query;

    if (error) {
      throw error;
    }

    return Response.json({ marks });
  } catch (error) {
    console.error("获取标点数据失败", error);
    return Response.json({ error: "获取失败" }, { status: 500 });
  }
}

// 保存标点数据
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (!rawBody || rawBody.trim().length === 0) {
      return Response.json(
        { error: "请求体为空，需提供 userId、fishId 与 address" },
        { status: 400 }
      );
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawBody) as Record<string, unknown>;
    } catch (parseError) {
      console.warn("标点请求体解析失败", parseError);
      return Response.json(
        { error: "请求体格式错误，需提供合法 JSON" },
        { status: 400 }
      );
    }

    const userId = typeof data.userId === "string" ? data.userId : null;
    const fishId = typeof data.fishId === "string" ? data.fishId : null;
    const address = typeof data.address === "string" ? data.address : null;

    if (!userId || !fishId || !address) {
      return Response.json(
        { error: "请求需包含 userId、fishId 与 address" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = uuid();

    try {
      // 使用 upsert 避免重复地址的约束冲突
      const { data, error } = await supabase
        .from('user_marks')
        .upsert({
          id,
          user_id: userId,
          fish_id: fishId,
          address,
          recorded_at: now,
          created_at: now
        }, {
          onConflict: 'user_id,fish_id,address'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return Response.json({ 
        success: true, 
        mark: { 
          id: data.id, 
          userId: data.user_id, 
          fishId: data.fish_id, 
          address: data.address, 
          recordedAt: data.recorded_at 
        }
      });
    } catch (error) {
      // 如果插入失败，尝试查询现有记录
      const { data: existingMark, error: selectError } = await supabase
        .from('user_marks')
        .select('id, user_id, fish_id, address, recorded_at, created_at')
        .eq('user_id', userId)
        .eq('fish_id', fishId)
        .eq('address', address)
        .single();

      if (selectError) {
        throw error; // 抛出原始插入错误
      }

      if (existingMark) {
        return Response.json({ 
          success: true, 
          mark: { 
            id: existingMark.id, 
            userId: existingMark.user_id, 
            fishId: existingMark.fish_id, 
            address: existingMark.address, 
            recordedAt: existingMark.recorded_at 
          }
        });
      }

      throw error; // 如果查询也失败，抛出原始错误
    }
  } catch (error) {
    console.error("保存标点数据失败", error);
    return Response.json({ error: "保存失败" }, { status: 500 });
  }
}

// 删除标点数据
export async function DELETE(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (!rawBody || rawBody.trim().length === 0) {
      return Response.json(
        { error: "请求体为空，需提供 userId 与 markId" },
        { status: 400 }
      );
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawBody) as Record<string, unknown>;
    } catch (parseError) {
      console.warn("删除标点请求体解析失败", parseError);
      return Response.json(
        { error: "请求体格式错误，需提供合法 JSON" },
        { status: 400 }
      );
    }

    const userId = typeof data.userId === "string" ? data.userId : null;
    const markId = typeof data.markId === "string" ? data.markId : null;

    if (!userId || !markId) {
      return Response.json(
        { error: "请求需包含 userId 与 markId" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_marks')
      .delete()
      .eq('id', markId)
      .eq('user_id', userId);

    if (error) {
      return Response.json({ error: "标点不存在或无权限删除" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("删除标点数据失败", error);
    return Response.json({ error: "删除失败" }, { status: 500 });
  }
}
