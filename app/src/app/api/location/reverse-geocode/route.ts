import { NextResponse } from "next/server";

const AMAP_API_KEY = process.env.AMAP_API_KEY ?? "";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fishId, latitude, longitude } = body ?? {};

    if (!fishId || typeof fishId !== "string") {
      return NextResponse.json({ error: "缺少有效的鱼类ID" }, { status: 400 });
    }

    if (
      typeof latitude !== "number" ||
      Number.isNaN(latitude) ||
      typeof longitude !== "number" ||
      Number.isNaN(longitude)
    ) {
      return NextResponse.json({ error: "缺少有效的定位坐标" }, { status: 400 });
    }

    const apiKey = AMAP_API_KEY.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "未配置高德API密钥" }, { status: 500 });
    }

    const params = new URLSearchParams({
      key: apiKey,
      location: `${longitude},${latitude}`,
      extensions: "all",
      radius: "1000",
      batch: "false",
    });

    const amapResponse = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!amapResponse.ok) {
      return NextResponse.json(
        { error: "请求高德服务失败" },
        { status: amapResponse.status }
      );
    }

    const amapResult = await amapResponse.json();

    if (amapResult.status !== "1" || !amapResult.regeocode) {
      const message = amapResult.info || "无法获取地址信息";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const formattedAddress = amapResult.regeocode.formatted_address as
      | string
      | undefined;
    const pois = Array.isArray(amapResult.regeocode.pois)
      ? amapResult.regeocode.pois
      : [];
    const poiName = pois.length > 0 ? pois[0]?.name : undefined;

    return NextResponse.json({
      fishId,
      address: poiName || formattedAddress || "",
      formattedAddress: formattedAddress || "",
      raw: amapResult.regeocode,
      coords: { latitude, longitude },
    });
  } catch (error) {
    console.error("逆地理编码接口异常", error);
    return NextResponse.json({ error: "服务器处理失败" }, { status: 500 });
  }
}
