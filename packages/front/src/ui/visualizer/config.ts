import { Visualizer } from './models'

const BasicVisualizer: Visualizer = {
  size: 0,
  ctx: null as unknown as CanvasRenderingContext2D,
  init(ctx, size) {
    this.ctx = ctx
    this.size = size
    this.ctx.lineWidth = 3
    this.ctx.strokeStyle = '#006aff'
  },
  draw(_, dataArray) {
    this.ctx.clearRect(0, 0, this.size, this.size)

    this.ctx.beginPath()
    const bufferLength = dataArray.length

    const sliceWidth = this.size / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * this.size) / 2

      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    this.ctx.lineTo(this.size, this.size / 2)
    this.ctx.stroke()
  }
}

const SmoothVisualizer: Visualizer = {
  init(ctx, size) {
    this.ctx = ctx
    this.size = size
  },
  draw(_, dataArray) {
    const bufferLength = dataArray.length
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    this.ctx.fillRect(0, 0, this.size, this.size)

    let avg = 0
    for (let i = 0; i < bufferLength; i++) {
      avg += Math.abs(dataArray[i] - 128)
    }
    avg /= bufferLength

    const hue = 200 + avg
    this.ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`
    this.ctx.lineWidth = 2
    this.ctx.beginPath()

    const sliceWidth = this.size / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * this.size) / 2

      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    this.ctx.stroke()
  },
  size: 0,
  ctx: null as unknown as CanvasRenderingContext2D
} satisfies Visualizer

const PsychedelicRadialVisualizer = {
  ctx: null as unknown as CanvasRenderingContext2D,
  size: 0,
  angle: 0,

  init(ctx, size) {
    this.ctx = ctx
    this.size = size
    this.angle = 0
  },

  draw(_, dataArray) {
    const ctx = this.ctx
    const bufferLength = dataArray.length
    const center = this.size / 2
    const radius = this.size / 4
    const maxLineLength = this.size / 2.5

    ctx.clearRect(0, 0, this.size, this.size)

    this.angle += 0.005 + Math.random() * 0.002

    ctx.save()
    ctx.translate(center, center)
    ctx.rotate(this.angle)

    const step = (Math.PI * 2) / bufferLength

    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i] / 255
      const len = radius + value * maxLineLength

      const angle = step * i
      const x = Math.cos(angle) * len
      const y = Math.sin(angle) * len

      const hue = ((angle * 180) / Math.PI + performance.now() / 10) % 360

      ctx.strokeStyle = `hsl(${hue}, 100%, ${40 + value * 60}%)`
      ctx.lineWidth = 1 + value * 3

      ctx.beginPath()
      ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    ctx.restore()
  }
} satisfies Visualizer & { angle: number }

const ParticleVisualizer = {
  ctx: null as unknown as CanvasRenderingContext2D,
  size: 0,
  particles: [] as {
    x: number
    y: number
    vx: number
    vy: number
    life: number
  }[],
  noise: 0,

  init(ctx, size) {
    this.ctx = ctx
    this.size = size
    this.particles = []
    this.noise = 0
  },

  draw(_, dataArray) {
    const ctx = this.ctx
    const size = this.size
    const bufferLength = dataArray.length
    const center = size / 2

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.clearRect(0, 0, size, size)

    let loudness = 0
    for (let i = 0; i < bufferLength; i++) {
      loudness += Math.abs(dataArray[i] - 128)
    }
    loudness /= bufferLength

    for (let i = 0; i < loudness / 2; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() ** 2 * 4 + 1 // Skewed toward lower speeds
      this.particles.push({
        x: center,
        y: center,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60 + Math.random() * 60
      })
    }

    this.noise += 0.05 + loudness / 200

    const maxDistance = size / 2

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.life -= 1

      const dx = p.x - center
      const dy = p.y - center
      const dist = Math.sqrt(dx * dx + dy * dy)
      const alpha = Math.max(0, 1 - dist / maxDistance)

      if (p.life <= 0 || alpha <= 0) {
        this.particles.splice(i, 1)
        continue
      }

      ctx.fillStyle = `hsla(${
        (p.life * 3 + performance.now() / 10) % 360
      }, 100%, 70%, ${alpha.toFixed(2)})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
} satisfies Visualizer & Record<any, any>

export const SpinningTriangleVisualizer = {
  ctx: null as unknown as CanvasRenderingContext2D,
  size: 0,
  angle: 0,
  init(ctx, size) {
    this.ctx = ctx
    this.size = size
    this.angle = 0
  },

  draw(_, dataArray) {
    const ctx = this.ctx
    const size = this.size
    const center = size / 2
    const bufferLength = dataArray.length

    // Clear with subtle trail
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
    ctx.fillRect(0, 0, size, size)

    // Compute normalized average amplitude
    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      sum += Math.abs(dataArray[i] - 128)
    }
    let avg = sum / bufferLength

    // Apply a non-linear boost to make small differences more visible
    avg = Math.pow(avg / 128, 0.7) * 128 // Exponential curve for sensitivity

    // Scale and hue based on boosted average
    const scale = 0.3 + avg / 150 // More reactive scaling
    const hue = (200 + avg * 3 + performance.now() / 30) % 360

    // Faster and more responsive rotation
    this.angle += 0.01 + avg / 300

    ctx.save()
    ctx.translate(center, center)
    ctx.rotate(this.angle)

    ctx.beginPath()
    const radius = size * scale
    for (let i = 0; i < 3; i++) {
      const angle = ((Math.PI * 2) / 3) * i - Math.PI / 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()

    ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`
    ctx.lineWidth = 4
    ctx.stroke()

    ctx.restore()
  }
} satisfies Visualizer & { angle: number }

export const visualizers = {
  Basic: BasicVisualizer,
  Smooth: SmoothVisualizer,
  Radial: PsychedelicRadialVisualizer,
  Particle: ParticleVisualizer,
  Triangle: SpinningTriangleVisualizer
}

export const defaultVisualizer = BasicVisualizer
