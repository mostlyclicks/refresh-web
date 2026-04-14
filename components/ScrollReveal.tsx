'use client'

import { useEffect, useRef, useState } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number       // ms
  direction?: 'up' | 'left' | 'right' | 'none'
  distance?: number    // px
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 24,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const translate =
    direction === 'up'    ? `0, ${distance}px` :
    direction === 'left'  ? `-${distance}px, 0` :
    direction === 'right' ? `${distance}px, 0` :
    '0, 0'

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0, 0)' : `translate(${translate})`,
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
