import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'

// Registrar plugins de GSAP
gsap.registerPlugin(ScrollTrigger, TextPlugin)

// Hook para animación de fade in
export const useFadeIn = (delay = 0) => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: 'power3.out',
        }
      )
    }
  }, [delay])

  return ref
}

// Hook para animación de slide in
export const useSlideIn = (direction = 'left', delay = 0) => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      const xValue = direction === 'left' ? -100 : direction === 'right' ? 100 : 0
      const yValue = direction === 'up' ? 100 : direction === 'down' ? -100 : 0

      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          x: xValue,
          y: yValue,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 1,
          delay,
          ease: 'power3.out',
        }
      )
    }
  }, [direction, delay])

  return ref
}

// Hook para animación con scroll trigger
export const useScrollAnimation = (animation = 'fadeIn') => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      let animationProps = {}

      switch (animation) {
        case 'fadeIn':
          animationProps = {
            from: { opacity: 0, y: 50 },
            to: { opacity: 1, y: 0 }
          }
          break
        case 'slideLeft':
          animationProps = {
            from: { opacity: 0, x: 100 },
            to: { opacity: 1, x: 0 }
          }
          break
        case 'slideRight':
          animationProps = {
            from: { opacity: 0, x: -100 },
            to: { opacity: 1, x: 0 }
          }
          break
        case 'scale':
          animationProps = {
            from: { opacity: 0, scale: 0.8 },
            to: { opacity: 1, scale: 1 }
          }
          break
        case 'rotate':
          animationProps = {
            from: { opacity: 0, rotation: -15 },
            to: { opacity: 1, rotation: 0 }
          }
          break
        default:
          animationProps = {
            from: { opacity: 0 },
            to: { opacity: 1 }
          }
      }

      gsap.fromTo(
        ref.current,
        animationProps.from,
        {
          ...animationProps.to,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top bottom-=100',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [animation])

  return ref
}

// Hook para animación de texto tipo máquina de escribir
export const useTypewriter = (text, delay = 0) => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = ''
      gsap.to(ref.current, {
        duration: text.length * 0.05,
        text: text,
        delay,
        ease: 'none',
      })
    }
  }, [text, delay])

  return ref
}

// Hook para animación de hover
export const useHoverAnimation = (scaleValue = 1.05) => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      const element = ref.current

      const handleMouseEnter = () => {
        gsap.to(element, {
          scale: scaleValue,
          duration: 0.3,
          ease: 'power2.out',
        })
      }

      const handleMouseLeave = () => {
        gsap.to(element, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        })
      }

      element.addEventListener('mouseenter', handleMouseEnter)
      element.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter)
        element.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [scaleValue])

  return ref
}

// Hook para animación de parallax
export const useParallax = (speed = 0.5) => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      gsap.to(ref.current, {
        yPercent: -50 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [speed])

  return ref
}

// Hook para animación de contador
export const useCountAnimation = (end, duration = 2, start = 0) => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      const obj = { value: start }

      gsap.to(obj, {
        value: end,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = Math.round(obj.value).toLocaleString()
          }
        },
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom-=100',
          toggleActions: 'play none none none',
        },
      })
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [end, duration, start])

  return ref
}

// Hook para stagger animation
export const useStaggerAnimation = (childrenSelector = '> *', stagger = 0.1) => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      const children = ref.current.querySelectorAll(childrenSelector)
      
      gsap.fromTo(
        children,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: stagger,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top bottom-=100',
            toggleActions: 'play none none none',
          },
        }
      )
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [childrenSelector, stagger])

  return ref
}
