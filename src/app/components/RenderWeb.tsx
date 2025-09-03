"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function RenderWeb() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const params = useSearchParams();

  useEffect(() => {
    const finalHtml = params.get("finalHtml") || "";

    if (iframeRef.current) {
      iframeRef.current.srcdoc = finalHtml;
    }
  }, [params]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
      className="w-full h-screen border"
    />
  );
}
