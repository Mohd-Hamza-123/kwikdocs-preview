'use client'
import React, { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

const page = () => {

    const iframeRef = useRef<HTMLIFrameElement>(null)
    const params = useSearchParams()

    const renderPage = (html: string, css: string, js: string) => {

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
    if(iframeRef.current){
        iframeRef.current.srcdoc = finalHtml
    }
    }

    useEffect(() => {
        const html = params.get("html") || '<h1>Hello World</h1>'
        const css = params.get("css") || ""
        const js = params.get("javaScript") || ''
        renderPage(html, css, js)
    }, [params])

    return (
        <div>
            <iframe
                ref={iframeRef}
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                className="w-full h-screen border"
            />
        </div>
    )
}

export default page