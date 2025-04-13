"use client"

import { useEffect, useRef } from "react"

interface EmotionPerformanceChartProps {
  emotion: string
  patientId: string // ✅ CAMBIO: de number a string
}

// Mock data generator for the chart
const generateMockData = (emotion: string, patientId: string) => {
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  // ✅ Para mantener la lógica anterior, convertimos patientId a número de forma segura
  const numericId = Array.from(patientId).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const seed = (emotion.charCodeAt(0) + numericId) % 10

  return days.map((day) => {
    const baseValue = 50 + seed * 5
    const randomVariation = Math.floor(Math.random() * 30) - 15
    const value = Math.min(Math.max(baseValue + randomVariation, 30), 95)

    return { day, value }
  })
}

export default function EmotionPerformanceChart({ emotion, patientId }: EmotionPerformanceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const data = generateMockData(emotion, patientId)

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    const chartWidth = canvasRef.current.width - 60
    const chartHeight = canvasRef.current.height - 60
    const barWidth = chartWidth / data.length - 10

    ctx.fillStyle = "#000"
    ctx.font = "14px Arial"
    ctx.fillText(`Emoción: ${emotion}`, 20, 20)

    ctx.beginPath()
    ctx.moveTo(40, 30)
    ctx.lineTo(40, chartHeight + 30)
    ctx.lineTo(chartWidth + 50, chartHeight + 30)
    ctx.strokeStyle = "#ccc"
    ctx.stroke()

    ctx.fillStyle = "#666"
    ctx.font = "10px Arial"
    ctx.fillText("100%", 10, 30)
    ctx.fillText("50%", 15, chartHeight / 2 + 30)
    ctx.fillText("0%", 20, chartHeight + 30)

    data.forEach((item, index) => {
      const x = 50 + index * (barWidth + 10)
      const barHeight = (item.value / 100) * chartHeight
      const y = chartHeight + 30 - barHeight

      let color
      switch (emotion.toLowerCase()) {
        case "feliz":
          color = "#4CAF50"
          break
        case "triste":
          color = "#2196F3"
          break
        case "enojado":
          color = "#F44336"
          break
        default:
          color = "#9C27B0"
      }

      ctx.fillStyle = color
      ctx.fillRect(x, y, barWidth, barHeight)

      ctx.fillStyle = "#000"
      ctx.font = "10px Arial"
      ctx.fillText(`${item.value}%`, x + barWidth / 2 - 10, y - 5)

      ctx.fillStyle = "#666"
      ctx.font = "10px Arial"
      ctx.fillText(item.day.substring(0, 3), x + barWidth / 2 - 10, chartHeight + 45)
    })
  }, [emotion, patientId])

  return (
    <div className="space-y-2">
      <h3 className="text-md font-medium">{emotion}</h3>
      <div className="border rounded-lg p-2 bg-white">
        <canvas ref={canvasRef} width={500} height={200} className="w-full h-auto" />
      </div>
    </div>
  )
}
