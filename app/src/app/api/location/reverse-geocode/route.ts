import { NextResponse } from "next/server";

import { wgs84ToGcj02 } from "@/lib/coordinate";

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

    const converted = wgs84ToGcj02(latitude, longitude);

    const params = new URLSearchParams({
      key: apiKey,
      location: `${converted.longitude},${converted.latitude}`,
      extensions: "all",
      radius: "300",
      batch: "false",
      sortrule: "distance",
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

    const poiName = (() => {
      const nearest = pois
        .map((poi: unknown) => {
          if (!poi || typeof poi !== "object") {
            return null;
          }

          const candidate = poi as { name?: unknown; distance?: unknown };
          const distance =
            typeof candidate.distance === "number"
              ? candidate.distance
              : typeof candidate.distance === "string"
              ? Number.parseFloat(candidate.distance)
              : Number.POSITIVE_INFINITY;

          if (!Number.isFinite(distance)) {
            return null;
          }

          const name =
            typeof candidate.name === "string" && candidate.name.trim() !== ""
              ? candidate.name.trim()
              : undefined;

          return { distance, name };
        })
        .filter((item): item is { distance: number; name?: string } => item !== null)
        .sort((a, b) => a.distance - b.distance)[0];

      return nearest?.name;
    })();

    return NextResponse.json({
      fishId,
      address: poiName || formattedAddress || "",
      formattedAddress: formattedAddress || "",
      raw: amapResult.regeocode,
      coords: {
        latitude,
        longitude,
        gcjLatitude: converted.latitude,
        gcjLongitude: converted.longitude,
      },
    });
  } catch (error) {
    console.error("逆地理编码接口异常", error);
    return NextResponse.json({ error: "服务器处理失败" }, { status: 500 });
  }
}
