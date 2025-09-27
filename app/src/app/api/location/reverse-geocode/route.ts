import { NextResponse } from "next/server";

import { wgs84ToGcj02 } from "@/lib/coordinate";

type AMapPoi = {
  name?: unknown;
  address?: unknown;
  distance?: unknown;
};

type AMapRegeo = {
  formatted_address?: unknown;
  addressComponent?: unknown;
  pois?: unknown;
};

function isPoi(value: unknown): value is AMapPoi {
  return !!value && typeof value === "object";
}

function parseDistance(candidate: unknown): number | null {
  if (typeof candidate === "number") {
    return Number.isFinite(candidate) ? candidate : null;
  }
  if (typeof candidate === "string") {
    const parsed = Number.parseFloat(candidate);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickNearestPoi(pois: unknown): {
  name: string;
  address?: string;
  distance: number;
} | null {
  if (!Array.isArray(pois)) return null;

  const candidates = pois
    .filter(isPoi)
    .map((poi) => {
      const name = typeof poi.name === "string" ? poi.name.trim() : "";
      const address =
        typeof poi.address === "string" ? poi.address.trim() : undefined;
      const distance = parseDistance(poi.distance);
      return {
        name,
        address,
        distance,
      };
    })
    .filter(
      (poi): poi is { name: string; address?: string; distance: number } =>
        poi.name.length > 0 && typeof poi.distance === "number"
    )
    .sort((a, b) => a.distance - b.distance);

  return candidates.length > 0 ? candidates[0] : null;
}

function buildAddressFromComponent(component: unknown): string | undefined {
  if (!component || typeof component !== "object") return undefined;
  const base = component as Record<string, unknown>;
  const district = typeof base.district === "string" ? base.district.trim() : "";
  const township =
    typeof base.township === "string" ? base.township.trim() : "";
  const neighborhood =
    base.neighborhood && typeof base.neighborhood === "object"
      ? base.neighborhood
      : null;
  const neighborhoodName =
    neighborhood && typeof (neighborhood as Record<string, unknown>).name === "string"
      ? ((neighborhood as Record<string, unknown>).name as string).trim()
      : "";
  const streetNumber =
    base.streetNumber && typeof base.streetNumber === "object"
      ? (base.streetNumber as Record<string, unknown>)
      : null;
  const street =
    streetNumber && typeof streetNumber.street === "string"
      ? streetNumber.street.trim()
      : "";
  const number =
    streetNumber && typeof streetNumber.number === "string"
      ? streetNumber.number.trim()
      : "";

  const streetLine = [street, number].filter(Boolean).join("");

  const segments = [district, township, neighborhoodName, streetLine]
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  return segments.length > 0 ? segments.join("") : undefined;
}

function formatDistance(distance: number): string {
  if (!Number.isFinite(distance) || distance <= 0) {
    return "";
  }

  if (distance < 1) {
    return "不足1米";
  }

  if (distance < 1000) {
    const rounded = Math.max(1, Math.round(distance));
    return `${rounded}米`;
  }

  const inKm = distance / 1000;
  const roundedKm = inKm >= 10 ? Math.round(inKm) : Number(inKm.toFixed(1));
  return `${roundedKm}公里`;
}

function buildBestAddress(regeocode: AMapRegeo): {
  preferred: string;
  formattedFallback: string;
} {
  const formatted =
    typeof regeocode.formatted_address === "string"
      ? regeocode.formatted_address
      : "";

  const fallbackFromComponent =
    buildAddressFromComponent(regeocode.addressComponent) || "";

  const fallback = formatted || fallbackFromComponent;

  const nearestPoi = pickNearestPoi(regeocode.pois);

  if (!nearestPoi) {
    return { preferred: fallback, formattedFallback: formatted };
  }

  // 忽略距离过远的POI，以免误导用户
  if (nearestPoi.distance > 800) {
    return { preferred: fallback, formattedFallback: formatted };
  }

  const distanceText = formatDistance(nearestPoi.distance);
  const detailParts = [nearestPoi.name];

  if (nearestPoi.address && nearestPoi.address !== nearestPoi.name) {
    detailParts.push(nearestPoi.address);
  } else if (fallback && fallback !== nearestPoi.name) {
    detailParts.push(fallback);
  }

  const detail = detailParts.join(" · ");
  const preferred = distanceText
    ? `${detail}（距当前位置约${distanceText}）`
    : detail;

  return {
    preferred,
    formattedFallback: formatted,
  };
}

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
      radius: "500",
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

    const regeocode = amapResult.regeocode as AMapRegeo;
    const { preferred, formattedFallback } = buildBestAddress(regeocode);

    return NextResponse.json({
      fishId,
      address: preferred,
      formattedAddress: formattedFallback,
      raw: regeocode,
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
