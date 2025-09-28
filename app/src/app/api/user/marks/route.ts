import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

const db = getDb();

// 获取用户的标点数据
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const fishId = req.nextUrl.searchParams.get("fishId");
  
  if (!userId) {
    return Response.json({ error: "缺少 userId 参数" }, { status: 400 });
  }

  try {
    let query = "SELECT id, user_id, fish_id, address, recorded_at, created_at FROM user_marks WHERE user_id = ?";
    const params: string[] = [userId];
    
    if (fishId) {
      query += " AND fish_id = ?";
      params.push(fishId);
    }
    
    query += " ORDER BY recorded_at DESC";
    
    const stmt = db.prepare(query);
    const marks = stmt.all(...params) as Array<{
      id: string;
      user_id: string;
      fish_id: string;
      address: string;
      recorded_at: string;
      created_at: string;
    }>;

    return Response.json({ marks });
  } catch (error) {
    console.error("获取标点数据失败", error);
    return Response.json({ error: "获取失败" }, { status: 500 });
  }
}

// 保存标点数据
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId, fishId, address } = data;

    if (!userId || !fishId || !address) {
      return Response.json(
        { error: "请求需包含 userId、fishId 与 address" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = uuid();

    // 使用 INSERT OR IGNORE 避免重复地址的约束冲突
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO user_marks (id, user_id, fish_id, address, recorded_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(id, userId, fishId, address, now, now);

    // 如果没有插入新记录（因为重复），查询现有记录
    if (result.changes === 0) {
      const selectStmt = db.prepare(`
        SELECT id, user_id, fish_id, address, recorded_at, created_at 
        FROM user_marks 
        WHERE user_id = ? AND fish_id = ? AND address = ?
      `);
      const existingMark = selectStmt.get(userId, fishId, address) as any;
      
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
    }

    return Response.json({ 
      success: true, 
      mark: { id, userId, fishId, address, recordedAt: now }
    });
  } catch (error) {
    console.error("保存标点数据失败", error);
    return Response.json({ error: "保存失败" }, { status: 500 });
  }
}

// 删除标点数据
export async function DELETE(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId, markId } = data;

    if (!userId || !markId) {
      return Response.json(
        { error: "请求需包含 userId 与 markId" },
        { status: 400 }
      );
    }

    const deleteStmt = db.prepare("DELETE FROM user_marks WHERE id = ? AND user_id = ?");
    const result = deleteStmt.run(markId, userId);

    if (result.changes === 0) {
      return Response.json({ error: "标点不存在或无权限删除" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("删除标点数据失败", error);
    return Response.json({ error: "删除失败" }, { status: 500 });
  }
}
