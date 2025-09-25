import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "鱼眼",
    short_name: "鱼眼",
    description: "拍照识鱼、解锁专属图鉴进度的移动端应用",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "zh-CN",
    background_color: "#f8fafc",
    theme_color: "#0ea5e9",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
