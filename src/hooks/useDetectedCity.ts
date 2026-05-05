'use client'
import { useState, useEffect } from 'react'

type DetectionState = 'idle' | 'detecting' | 'detected' | 'failed'

export function useDetectedCity() {
  const [city, setCity] = useState('')
  const [state, setState] = useState<DetectionState>('idle')

  useEffect(() => {
    setState('detecting')
    fetch('https://ipapi.co/json/', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const detected = data?.city as string | undefined
        if (detected) {
          setCity(detected)
          setState('detected')
        } else {
          setState('failed')
        }
      })
      .catch(() => setState('failed'))
  }, [])

  return { detectedCity: city, detectionState: state }
}
