import { NextRequest } from "next/server";
import { fishList } from "@/data/fish-list";

const API_ENDPOINT = "https://api.siliconflow.cn/v1/chat/completions";
const MODEL = "zai-org/GLM-4.5V";

function sanitizeContent(raw: string) {
  let trimmed = raw.trim();

  if (trimmed.startsWith("```")) {
    const lines = trimmed.split(/\r?\n/);
    // 移除开头 ```xxx
    lines.shift();
    // 如果最后一行是 ``` 则移除
    if (lines.length && lines[lines.length - 1].trim().startsWith("```")) {
      lines.pop();
    }
    trimmed = lines.join("\n").trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function removeTrailingCommas(json: string) {
  return json.replace(/,\s*([}\]])/g, "$1");
}

function normalizeSingleQuotes(json: string) {
  const replacedSmartQuotes = json
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
  const normalizedKeys = replacedSmartQuotes.replace(
    /'([^']+)'(\s*:)/g,
    (_, key: string, suffix: string) => `"${key}"${suffix}`,
  );
  return normalizedKeys.replace(/:\s*'([^']*)'/g, (_, value: string) => {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `: "${escaped}"`;
  });
}

function parseJsonContent(content: string) {
  const cleaned = sanitizeContent(content);
  const attempts = [cleaned];
  const withoutTrailingCommas = removeTrailingCommas(cleaned);
  if (withoutTrailingCommas !== cleaned) {
    attempts.push(withoutTrailingCommas);
  }
  const normalizedQuotes = normalizeSingleQuotes(withoutTrailingCommas);
  if (!attempts.includes(normalizedQuotes)) {
    attempts.push(normalizedQuotes);
  }
  const doubleQuoted = normalizedQuotes.replace(/'/g, '"');
  if (!attempts.includes(doubleQuoted)) {
    attempts.push(doubleQuoted);
  }

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (error) {
      lastError = error;
    }
  }

  console.error("识别结果解析失败", content, lastError);
  throw lastError ?? new Error("无法解析识别结果");
}

type RecognitionPayload = {
  status: string;
  name_cn?: string;
  name_lat?: string;
  family?: string;
  description?: string;
  confidence?: number;
  reason?: string;
  unlock_fish_id?: string;
  unlock_confidence?: number;
};

function normalizeParsedResult(raw: unknown): RecognitionPayload {
  if (!raw || typeof raw !== "object") {
    return {
      status: "unrecognized",
      reason: "识别结果格式无效。",
    };
  }

  const record = raw as Record<string, unknown>;
  const statusRaw =
    typeof record.status === "string" ? record.status.trim() : "unrecognized";
  const loweredStatus = statusRaw.toLowerCase();
  const status =
    loweredStatus === "success" || loweredStatus === "recognized"
      ? "ok"
      : loweredStatus === "fail" || loweredStatus === "failed"
        ? "unrecognized"
        : loweredStatus;

  const confidenceRaw = record.confidence;
  let confidence: number | undefined;
  if (typeof confidenceRaw === "number" && Number.isFinite(confidenceRaw)) {
    confidence = confidenceRaw;
  } else if (typeof confidenceRaw === "string") {
    const cleaned = confidenceRaw.replace(/[^0-9.,-]/g, "");
    if (cleaned) {
      const normalized = cleaned.replace(",", ".");
      let parsed = Number.parseFloat(normalized);
      if (!Number.isNaN(parsed)) {
        if (parsed > 1) {
          parsed = parsed / 100;
        }
        parsed = Math.min(Math.max(parsed, 0), 1);
        confidence = parsed;
      }
    }
  }

  const reason = typeof record.reason === "string" ? record.reason : undefined;

  const normalized: RecognitionPayload = {
    status,
    name_cn: typeof record.name_cn === "string" ? record.name_cn : undefined,
    name_lat: typeof record.name_lat === "string" ? record.name_lat : undefined,
    family: typeof record.family === "string" ? record.family : undefined,
    description:
      typeof record.description === "string" ? record.description : undefined,
    confidence,
    reason,
    unlock_fish_id: typeof record.unlock_fish_id === "string" ? record.unlock_fish_id : undefined,
    unlock_confidence: typeof record.unlock_confidence === "number" ? record.unlock_confidence : undefined,
  };

  if (normalized.status !== "ok" && !normalized.reason) {
    normalized.reason = "未能识别鱼种，请尝试拍摄更清晰的照片。";
  }

  return normalized;
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = await req.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return Response.json(
        { error: "缺少图片数据" },
        { status: 400 }
      );
    }

    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      console.error("未配置 SILICONFLOW_API_KEY 环境变量");
      return Response.json({ error: "识别服务未配置" }, { status: 500 });
    }

    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    // 构建鱼类图鉴数据
    const fishEncyclopedia = fishList.map(fish => ({
      id: fish.id,
      name_cn: fish.name_cn,
      name_lat: fish.name_lat,
      family: fish.family,
      description: fish.description,
      rarity: fish.rarity
    }));

    const body = {
      model: MODEL,
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content:
            "你是一名资深鱼类生物学专家，需要根据图片识别鱼类并判断是否解锁图鉴。请分析图片中的鱼类，与提供的图鉴数据库进行匹配，并直接判断是否解锁某个图鉴。返回JSON格式结果，包含识别信息和解锁判断。",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "auto",
              },
            },
            {
              type: "text",
              text:
                `请识别该图像中的鱼类，并与以下图鉴数据库进行匹配：

图鉴数据库：
${JSON.stringify(fishEncyclopedia, null, 2)}

请输出严格JSON格式：
{
  "status": "ok|unrecognized",
  "name_cn": "中文名",
  "name_lat": "拉丁学名", 
  "family": "所属科目",
  "description": "简介",
  "confidence": 0.0,
  "unlock_fish_id": "匹配的图鉴ID或null",
  "unlock_confidence": 0.0
}

判断规则：
1. 如果图片中的鱼类与图鉴中的某个鱼类高度匹配，设置unlock_fish_id为该鱼类的id
2. 如果只是相似但不完全确定，unlock_fish_id为null
3. unlock_confidence表示解锁的置信度(0-1)
4. 无法识别时返回 {"status":"unrecognized","reason":"原因"}`,
            },
          ],
        },
      ],
    };

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SiliconFlow API error", response.status, errorText);
      return Response.json(
        { error: "识别服务调用失败" },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (typeof data?.code === "number" && data.code !== 0) {
      console.error("SiliconFlow业务错误", data);
      return Response.json(
        { error: data?.message || "识别服务返回错误" },
        { status: 502 }
      );
    }

    const assistantMessage = data?.choices?.[0]?.message;
    let content: string | undefined;

    if (typeof assistantMessage?.content === "string") {
      content = assistantMessage.content;
    } else if (Array.isArray(assistantMessage?.content)) {
      const segments = assistantMessage.content as Array<
        { text?: string; content?: string }
      >;
      content = segments
        .map((segment) => segment?.text || segment?.content || "")
        .join("\n");
    }

    if (!content) {
      console.error("识别服务返回内容为空", data);
      return Response.json(
        { error: "识别结果为空" },
        { status: 500 }
      );
    }

    try {
      const parsed = parseJsonContent(content);
      const normalized = normalizeParsedResult(parsed);
      return Response.json({ result: normalized });
    } catch (error) {
      console.error("识别结果格式错误", error);
      return Response.json(
        {
          result: {
            status: "unrecognized",
            reason: "识别结果解析失败，请稍后重试或上传更清晰的照片。",
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("识别接口异常", error);
    return Response.json({ error: "识别流程异常" }, { status: 500 });
  }
}
