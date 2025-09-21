"use client";
import { useEffect, useRef, useState } from "react";

export default function RenderWeb() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [x, setx] = useState('')

  useEffect(() => {
    function onMessage(ev: MessageEvent) {

      console.log("child got message:", ev);
    
      // Optionally validate origin
      // if (ev.origin !== "http://localhost:3000") return;

      const data = ev.data;
      
      if (!data || typeof data !== "object") return;
    
      if (data.type === "parent-message" && typeof data.code === "string") {
        console.log("child: received parent-message HTML length:", data.code.length);
        setx(data.code)
        if (iframeRef.current) {
          try {
            iframeRef.current.srcdoc = data.code;
          } catch (err) {
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

        // send ack
        try {
          window.parent.postMessage({ type: "child-ack", status: "ok" }, ev.origin || "*");
        } catch (err) {
          console.error("child ack error", err);
        }
        return;
      }

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

    // register listener
    window.addEventListener("message", onMessage);

    // IMPORTANT: announce ready to parent so it can send code (handshake)
    try {
      // target origin can be "*" for dev, or exact e.g. "http://localhost:3000"
      window.parent.postMessage({ type: "child-ready" }, "*");
      console.log("child: posted child-ready");
    } catch (err) {
      console.error("child: failed to post child-ready", err);
    }

    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <>
    {/* <article>
      {JSON.stringify(x)}
    </article> */}
    <iframe
      ref={iframeRef}
      title="preview-srcdoc"
      className="w-full h-screen border"
    />
    </>
  );
}















