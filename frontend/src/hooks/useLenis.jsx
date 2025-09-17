import React, { createContext, useContext, useEffect, useState } from 'react'
import Lenis from '@studio-freight/lenis'

const LenisContext = createContext(null)

export const LenisProvider = ({ children }) => {
  const [lenis, setLenis] = useState(null)

  useEffect(() => {
    const lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    })

    setLenis(lenisInstance)

    // Función de animación
    function raf(time) {
      lenisInstance.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // Limpiar cuando el componente se desmonte
    return () => {
      lenisInstance.destroy()
    }
  }, [])

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  )
}

export const useLenis = () => {
  const lenis = useContext(LenisContext)
  
  const scrollTo = (target, options = {}) => {
    if (lenis) {
      lenis.scrollTo(target, {
        offset: 0,
        immediate: false,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        ...options
      })
    }
  }

  const stop = () => {
    if (lenis) lenis.stop()
  }

  const start = () => {
    if (lenis) lenis.start()
  }

  return { lenis, scrollTo, stop, start }
}
