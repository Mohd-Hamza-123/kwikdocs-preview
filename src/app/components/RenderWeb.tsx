"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function RenderWeb() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const params = useSearchParams();

  useEffect(() => {
    const finalHtml = params.get("finalHtml") || "";

    if (!iframeRef.current) return;

    // 1) Small console bridge injected into the user's HTML.
    //    It forwards console messages (and errors) to the renderer window (parent of srcdoc iframe).
    const consoleBridge = `
      <script>
        (function(){
          function send(type, args) {
            try {
              // stringify arguments reasonably
              const payload = args.map(a => {
                try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
                catch(e){ return String(a); }
              }).join(' ');
              // send to the renderer window (parent of this srcdoc iframe)
              window.parent.postMessage({ __from: 'srcdoc-bridge', type: 'iframe-console', logType: type, value: payload }, '*');
            } catch(e) {}
          }

          const methods = ['log','error','warn','info','debug','clear'];
          methods.forEach((m) => {
            console[m] = function(...args) {
              send(m, args);
              // Do NOT call the original console to avoid duplicate messages in DevTools
            };
          });

          window.addEventListener('error', function(e) {
            send('error', [ (e && e.message) ? (e.message + ' at ' + (e.lineno||e.lineNumber) + ':' + (e.colno||e.colNumber)) : String(e) ]);
          });

          window.addEventListener('unhandledrejection', function(e) {
            try { send('error', ['Unhandled promise rejection: ' + (e && e.reason ? (typeof e.reason === 'object' ? JSON.stringify(e.reason) : String(e.reason)) : String(e)) ]); }
            catch(e){}
          });
        })();
      </script>
    `;

    // 2) Insert the bridge into the HEAD (if present) or at top of the HTML
    let patchedHtml = finalHtml;
    if (/<head\b[^>]*>/i.test(finalHtml)) {
      // inject immediately after the opening <head>
      patchedHtml = finalHtml.replace(/<head\b[^>]*>/i, (match) => match + consoleBridge);
    } else if (/<html\b[^>]*>/i.test(finalHtml)) {
      // inject after <html> if head is missing
      patchedHtml = finalHtml.replace(/<html\b[^>]*>/i, (match) => match + "<head>" + consoleBridge + "</head>");
    } else {
      // fallback: prepend the script
      patchedHtml = consoleBridge + finalHtml;
    }

    // 3) Set srcdoc (this loads the user's HTML into the nested iframe)
    iframeRef.current.srcdoc = patchedHtml;

  }, [params]);

  useEffect(() => {
    // Forward messages from the nested srcdoc iframe to the top (primary)
    const forwardHandler = (ev: MessageEvent) => {
      // Safety/identification: we only handle messages we injected (`__from === 'srcdoc-bridge'`)
      // You can (and should) tighten origin checks in production.
      const data = ev.data;
      if (!data || data.__from !== "srcdoc-bridge") return;

      // Optionally: transform or sanitize message here before forwarding
      try {
        // forward to the top-level window (the primary app)
        // targetOrigin: '*' used here for simplicity; use exact origin in production
        if (window.top) {
          window.top.postMessage({ type: 'iframe-console', logType: data.logType, value: data.value }, '*');
        } else {
          console.warn("No top-level window to forward to");
        }

      } catch (e) {
        // ignore
      }
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






