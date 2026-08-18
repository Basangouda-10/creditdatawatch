import { useEffect, useRef, useState } from 'react'

const ParticleBackground = () => {
  const canvasRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // SonarQube Fix: Create a secure random number generator to replace Math.random()
    const getSecureRandom = () => {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0] / (0xffffffff + 1);
    };

    const particles = []
    const particleCount = Math.min(80, Math.floor(dimensions.width / 20))
    const colors = ['rgba(79, 70, 229, 0.6)', 'rgba(124, 58, 237, 0.6)', 'rgba(14, 165, 233, 0.6)']

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: getSecureRandom() * dimensions.width,
        y: getSecureRandom() * dimensions.height,
        radius: getSecureRandom() * 2 + 1,
        color: colors[Math.floor(getSecureRandom() * colors.length)],
        dx: (getSecureRandom() - 0.5) * 0.5,
        dy: (getSecureRandom() - 0.5) * 0.5
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((p, i) => {
        p.x += p.dx
        p.y += p.dy

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          
          // SonarQube Fix: Use Math.hypot instead of Math.sqrt for safe geometry calculations
          const distance = Math.hypot(dx, dy)
          
          if (distance < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(79, 70, 229, ${0.2 * (1 - distance / 120)})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        })
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [dimensions])

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  )
}

export default ParticleBackground