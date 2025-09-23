import { NextRequest } from "next/server";

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

function parseJsonContent(content: string) {
  const cleaned = sanitizeContent(content);
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("识别结果解析失败", content, error);
    throw error;
  }
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

    const body = {
      model: MODEL,
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content:
            "你是一名资深鱼类生物学专家，需根据图片识别鱼类并返回JSON格式结果。任何输出都必须为有效的JSON对象，包含 name_cn、name_lat、family、description、confidence 字段，无法识别时请返回 {\"status\":\"unrecognized\",\"reason\":\"描述原因\"}。全部中文回复。",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
            {
              type: "text",
              text:
                "请识别该图像中的鱼类。如果能确定品种，请输出严格 JSON:\n{\"status\":\"ok\",\"name_cn\":\"中文名\",\"name_lat\":\"拉丁学名\",\"family\":\"所属科目\",\"description\":\"简介\",\"confidence\":0.0}。置信度范围0-1。无法识别请遵守 {\"status\":\"unrecognized\",\"reason\":\"原因\"} 格式。",
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
      return Response.json({ result: parsed });
    } catch {
      return Response.json(
        { error: "识别结果格式错误" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("识别接口异常", error);
    return Response.json({ error: "识别流程异常" }, { status: 500 });
  }
}
