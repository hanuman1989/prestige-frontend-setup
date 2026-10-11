import Image from "next/image";
import { useState } from "react";

// The backend must return a browser-accessible image URL; do not guess storage paths.
export function getCategoryImageUrl(value) {
  if (typeof value !== "string") return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return ["http:", "https:", "blob:"].includes(url.protocol) ? value : "";
  } catch {
    return "";
  }
}

export default function CategoryImage({ src, alt, className }) {
  const url = getCategoryImageUrl(src);
  const [failedUrl, setFailedUrl] = useState("");
  return url && failedUrl !== url ? (
    <Image key={url} src={url} alt={alt} width={320} height={180} unoptimized onError={() => setFailedUrl(url)} className={className} />
  ) : (
    <span role="img" aria-label="No category image" className={`${className} flex items-center justify-center bg-blue-50 text-[#53699b] dark:bg-gray-800`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 6-6 4 4 3-3 5 5" /></svg>
    </span>
  );
}
