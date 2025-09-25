const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.72;

export type CompressedImage = {
  dataUrl: string;
  mimeType: string;
};

function scaleDimensions(width: number, height: number) {
  const ratio = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

async function imageBitmapFromFile(file: File) {
  if ("createImageBitmap" in window && typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });
}

async function canvasToDataURL(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
) {
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("图片压缩失败"));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("压缩结果读取失败"));
          }
        };
        reader.onerror = () => {
          reject(reader.error ?? new Error("压缩结果读取失败"));
        };
        reader.readAsDataURL(blob);
      },
      mimeType,
      quality,
    );
  });
}

export async function compressImage(file: File): Promise<CompressedImage> {
  const bitmap = await imageBitmapFromFile(file);
  const targetType = file.type === "image/png" ? "image/png" : "image/jpeg";

  const sourceWidth = "width" in bitmap ? bitmap.width : bitmap.naturalWidth;
  const sourceHeight = "height" in bitmap ? bitmap.height : bitmap.naturalHeight;
  const { width, height } = scaleDimensions(sourceWidth, sourceHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: targetType !== "image/jpeg" });
  if (!context) {
    throw new Error("无法创建画布上下文");
  }
  context.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);

  if ("close" in bitmap && typeof (bitmap as ImageBitmap).close === "function") {
    (bitmap as ImageBitmap).close();
  }

  const quality = targetType === "image/jpeg" ? JPEG_QUALITY : undefined;
  const dataUrl = await canvasToDataURL(canvas, targetType, quality);

  return {
    dataUrl,
    mimeType: targetType,
  };
}
