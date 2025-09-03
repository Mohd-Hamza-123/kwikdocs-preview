import React, { Suspense } from 'react'
import RenderWeb from '../components/RenderWeb'

export default function Page() {
    return (
       <Suspense fallback={<div>Loading...</div>}>
           <RenderWeb />
       </Suspense>
    )
}
