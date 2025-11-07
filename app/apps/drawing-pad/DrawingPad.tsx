'use client'

import { useRef, useState, useEffect } from 'react'

export default function DrawingPad() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#0EA5E9')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#071A2F'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const getScaledCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getScaledCoordinates(clientX, clientY)

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (clientX: number, clientY: number) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getScaledCoordinates(clientX, clientY)

    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    startDrawing(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    draw(e.clientX, e.clientY)
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    if (touch) {
      startDrawing(touch.clientX, touch.clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    if (touch) {
      draw(touch.clientX, touch.clientY)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    stopDrawing()
  }

  const stopDrawing = () => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#071A2F'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Reduced color palette - essential colors that work well
  const colors = ['#0EA5E9', '#164E9D', '#FFFFFF', '#FF0000', '#00FF00']

  return (
    <div className="space-y-4">
      {/* Controls - responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Color picker section */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <label className="text-gray-300 text-sm sm:text-base whitespace-nowrap">Color:</label>
          <div className="flex gap-2 flex-1 min-w-0">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded border-2 transition-all ${
                  color === c ? 'border-accent scale-110' : 'border-primary-700 hover:border-primary-600'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>
        
        {/* Clear button - always visible and accessible */}
        <button
          onClick={clearCanvas}
          className="btn btn-secondary w-full sm:w-auto flex-shrink-0"
        >
          Clear
        </button>
      </div>
      
      {/* Canvas */}
      <div className="relative w-full" style={{ aspectRatio: '3/2' }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="w-full h-full border border-primary-700 rounded-md cursor-crosshair bg-primary-900"
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  )
}

