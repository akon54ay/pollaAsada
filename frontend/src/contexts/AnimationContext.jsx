import React, { createContext, useContext, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const AnimationContext = createContext(null)

export const AnimationProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [pageTransition, setPageTransition] = useState(false)

  useEffect(() => {
    // Configuración inicial de GSAP
    gsap.config({
      nullTargetWarn: false,
      force3D: true,
    })

    // Animación de carga inicial
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Función para transición entre páginas
  const triggerPageTransition = async () => {
    setPageTransition(true)
    
    // Crear overlay de transición
    const overlay = document.createElement('div')
    overlay.className = 'page-transition-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 9999;
      pointer-events: none;
    `
    document.body.appendChild(overlay)

    // Animar overlay
    await gsap.fromTo(overlay,
      { scaleY: 0, transformOrigin: 'bottom' },
      { 
        scaleY: 1, 
        duration: 0.5, 
        ease: 'power4.inOut',
      }
    )

    await gsap.to(overlay, {
      scaleY: 0,
      transformOrigin: 'top',
      duration: 0.5,
      ease: 'power4.inOut',
      delay: 0.1,
      onComplete: () => {
        overlay.remove()
        setPageTransition(false)
      }
    })
  }

  // Animación de entrada para elementos
  const animateIn = (element, options = {}) => {
    const defaults = {
      duration: 1,
      opacity: 1,
      y: 0,
      ease: 'power3.out',
      delay: 0,
    }

    const settings = { ...defaults, ...options }

    gsap.set(element, { opacity: 0, y: 30 })
    
    return gsap.to(element, settings)
  }

  // Animación de salida para elementos
  const animateOut = (element, options = {}) => {
    const defaults = {
      duration: 0.5,
      opacity: 0,
      y: -30,
      ease: 'power3.in',
      delay: 0,
    }

    const settings = { ...defaults, ...options }
    
    return gsap.to(element, settings)
  }

  // Animación de shake para errores
  const shakeAnimation = (element) => {
    return gsap.to(element, {
      x: [0, -10, 10, -10, 10, 0],
      duration: 0.5,
      ease: 'power2.inOut',
    })
  }

  // Animación de pulse para llamar la atención
  const pulseAnimation = (element) => {
    return gsap.to(element, {
      scale: [1, 1.05, 1],
      duration: 0.5,
      ease: 'power2.inOut',
      repeat: 2,
    })
  }

  // Timeline para animaciones secuenciales
  const createTimeline = () => {
    return gsap.timeline({
      defaults: {
        ease: 'power3.out',
        duration: 0.8,
      }
    })
  }

  const value = {
    isLoading,
    pageTransition,
    triggerPageTransition,
    animateIn,
    animateOut,
    shakeAnimation,
    pulseAnimation,
    createTimeline,
  }

  return (
    <AnimationContext.Provider value={value}>
      {isLoading ? <LoadingScreen /> : children}
    </AnimationContext.Provider>
  )
}

// Componente de pantalla de carga
const LoadingScreen = () => {
  useEffect(() => {
    const tl = gsap.timeline()

    tl.fromTo('.loading-logo',
      { scale: 0, rotation: -180 },
      { scale: 1, rotation: 0, duration: 1, ease: 'back.out(1.7)' }
    )
    .fromTo('.loading-text',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5 },
      '-=0.3'
    )
    .fromTo('.loading-spinner',
      { opacity: 0 },
      { opacity: 1, duration: 0.3 },
      '-=0.2'
    )
  }, [])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="loading-logo mb-8">
          <svg className="w-24 h-24 mx-auto text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-13h4v6h-4zm0 8h4v2h-4z"/>
          </svg>
        </div>
        <h1 className="loading-text text-3xl font-bold text-white mb-4">
          Pollería Sistema
        </h1>
        <div className="loading-spinner">
          <div className="inline-flex space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const useAnimation = () => {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error('useAnimation must be used within AnimationProvider')
  }
  return context
}
