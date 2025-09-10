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
          function formatArg(a) {
            try {
              if (typeof a === "object") {
                return JSON.stringify(a, null, 2); // pretty JSON
              }
              return String(a);
            } catch(e) {
              return String(a);
            }
          }

          function send(type, args) {
            try {
              let payload = args.map(formatArg).join(" ");

              // truncate very large payloads
              const MAX_LEN = 8000;
              if (payload.length > MAX_LEN) {
                payload = payload.slice(0, MAX_LEN) + "\\n... (truncated)";
              }

              window.parent.postMessage({
                __from: "srcdoc-bridge",
                type: "iframe-console",
                logType: type,
                value: payload,
                raw: args // keep raw values if parent wants to render JSON tree
              }, "*");
            } catch(e) {}
          }

          const methods = ["log","error","warn","info","debug","clear"];
          methods.forEach((m) => {
            const original = console[m];
            console[m] = function(...args) {
              send(m, args);
              // still call original console so DevTools works
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
                (e && e.reason 
                  ? (typeof e.reason === "object" ? JSON.stringify(e.reason, null, 2) : String(e.reason)) 
                  : String(e))
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
            { type: "iframe-console", logType: data.logType, value: data.value, raw: data.raw },
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
