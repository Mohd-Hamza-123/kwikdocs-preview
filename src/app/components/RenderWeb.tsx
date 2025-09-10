"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function RenderWeb() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const params = useSearchParams();

  useEffect(() => {
    const finalHtml = params.get("finalHtml") || "";

    if (!iframeRef.current) return;

    // --- Console bridge ---
    const consoleBridge = `
      <script>
        (function(){
          function send(type, args) {
            try {
              // send raw args instead of stringifying
              window.parent.postMessage({
                __from: "srcdoc-bridge",
                type: "iframe-console",
                logType: type,
                args: args
              }, "*");
            } catch(e) {}
          }

          const methods = ["log","error","warn","info","debug","clear"];
          methods.forEach((m) => {
            const original = console[m];
            console[m] = function(...args) {
              send(m, args);
              try { original.apply(console, args); } catch(_) {}
            };
          });

          window.addEventListener("error", function(e) {
            send("error", [
              (e && e.message) 
                ? (e.message + " at " + (e.lineno||e.lineNumber) + ":" + (e.colno||e.colNumber)) 
                : String(e)
            ]);
          });

          window.addEventListener("unhandledrejection", function(e) {
            try {
              send("error", [
                "Unhandled promise rejection: " + 
                (e && e.reason ? e.reason : "Unknown")
              ]);
            } catch(_) {}
          });
        })();
      </script>
    `;

    // --- Inject bridge ---
    let patchedHtml = finalHtml;
    if (/<head\b[^>]*>/i.test(finalHtml)) {
      patchedHtml = finalHtml.replace(/<head\b[^>]*>/i, (match) => match + consoleBridge);
    } else if (/<html\b[^>]*>/i.test(finalHtml)) {
      patchedHtml = finalHtml.replace(/<html\b[^>]*>/i, (match) => match + "<head>" + consoleBridge + "</head>");
    } else {
      patchedHtml = consoleBridge + finalHtml;
    }

    iframeRef.current.srcdoc = patchedHtml;
  }, [params]);

  useEffect(() => {
    const forwardHandler = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || data.__from !== "srcdoc-bridge") return;

      try {
        if (window.top) {
          window.top.postMessage(
            { type: "iframe-console", logType: data.logType, args: data.args },
            "*"
          );
        }
      } catch (_) {}
    };

    window.addEventListener("message", forwardHandler);
    return () => window.removeEventListener("message", forwardHandler);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
      className="w-full h-screen border"
    />
  );
}
