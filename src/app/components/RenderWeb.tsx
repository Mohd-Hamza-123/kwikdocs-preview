"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function RenderWeb() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const params = useSearchParams();

  useEffect(() => {
    const html = params.get("html") || "";
    const css = params.get("css") || "";
    const js = params.get("js") || "";

    const finalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="Content-Security-Policy"
                content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src * data:; connect-src *">
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
      </html>
    `;

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
