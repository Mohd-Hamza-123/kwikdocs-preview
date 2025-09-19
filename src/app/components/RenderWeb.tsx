"use client";
import { useEffect, useRef } from "react";

export default function RenderWeb() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    // register a single handler that logs everything (good for debugging)
    function onMessage(ev: MessageEvent) {
      // DEBUG: this prints in the preview page's console (open DevTools for this page)
      console.log("child got message:", ev);

      const data = ev.data;
      if (!data || typeof data !== "object") return;

      // handle parent updates
      if (data.type === "parent-message" && typeof data.code === "string") {
        console.log("child: received parent-message with HTML length:", data.code.length);

        // apply inside inner iframe
        if (iframeRef.current) {
          try {
            iframeRef.current.srcdoc = data.code;
          } catch (err) {
            // fallback: replace whole document (only if you control this page)
            console.error("failed to set srcdoc, writing document instead", err);
            document.open();
            document.write(data.code);
            document.close();
          }
        } else {
          document.open();
          document.write(data.code);
          document.close();
        }

        // optional: ack to parent
        try {
          (ev.source as Window)?.postMessage({ type: "child-ack", status: "ok" }, ev.origin || "*");
        } catch (_) {}
        return;
      }

      // your existing forwarding logic for srcdoc console bridge
      if (data.__from === "srcdoc-bridge") {
        try {
          window.top?.postMessage(
            {
              type: "iframe-console",
              logType: data.logType,
              value: data.value,
            },
            "*"
          );
        } catch (_) {}
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
      className="w-full h-screen border"
      title="preview-srcdoc"
    />
  );
}

















// "use client";
// import { useSearchParams } from "next/navigation";
// import { useEffect, useRef } from "react";

// export default function RenderWeb() {
//   const iframeRef = useRef<HTMLIFrameElement | null>(null);
//   const params = useSearchParams();


//   useEffect(() => {
//     const finalHtml = params.get("finalHtml") || "";
//     if (!iframeRef.current) return
//     iframeRef.current.srcdoc = finalHtml;
//   }, [params]);


//   const forwardHandler = (ev: MessageEvent) => {
//     console.log(ev)
//     const data = ev.data;
    
//     if (!data || data.__from !== "srcdoc-bridge") return;

//     try {
//       if (window.top) {
//         window.top.postMessage(
//           {
//             type: "iframe-console",
//             logType: data.logType,
//             value: data.value, // already raw array/object
//           },
//           "*"
//         );
//       }
//     } catch (_) { }
//   };

//   useEffect(() => {
//     // sending messages to parent window
//     window.addEventListener("message", forwardHandler);
//     return () => window.removeEventListener("message", forwardHandler);
//   }, []);

//   return (
//     <iframe
//       ref={iframeRef}
//       sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
//       className="w-full h-screen border"
//     />
//   );
// }
