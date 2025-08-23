'use client'

import { useEffect } from 'react'

export const useParticleEffect = () => {
  useEffect(() => {
    let throttleTimer: NodeJS.Timeout | null = null

    const createParticle = (e: MouseEvent) => {
      if (throttleTimer) return
      
      throttleTimer = setTimeout(() => {
        throttleTimer = null
      }, 100)

      const particle = document.createElement('div')
      particle.className = 'fixed w-1 h-1 bg-primary-400/60 rounded-full pointer-events-none z-[9999] animate-particle-fade'
      particle.style.left = `${e.clientX}px`
      particle.style.top = `${e.clientY}px`
      
      document.body.appendChild(particle)
      
      setTimeout(() => {
        particle.remove()
      }, 1000)
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Only create particles occasionally to avoid performance issues
      if (Math.random() > 0.95) {
        createParticle(e)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (throttleTimer) {
        clearTimeout(throttleTimer)
      }
    }
  }, [])
}