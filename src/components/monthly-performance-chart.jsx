"use client"

import { useEffect, useRef } from "react"

// Mock data generator for the chart
const generateMockMonthlyData = (patientId) => {
  const weeks = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"]
  const emotions = ["Feliz", "Triste", "Enojado"]

  // Generate data with some consistency based on patientId
  const seed = patientId % 5

  return weeks.map((week, weekIndex) => {
    const weekData = { week }

    emotions.forEach((emotion) => {
      // Create somewhat consistent data based on the seed and week
      const baseValue = 40 + seed * 5 + weekIndex * 3
      const randomVariation = Math.floor(Math.random() * 20) - 10
      const value = Math.min(Math.max(baseValue + randomVariation, 20), 95)

      weekData[emotion.toLowerCase()] = value
    })

    return weekData
  })
}

export default function MonthlyPerformanceChart({ patientId }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const data = generateMockMonthlyData(patientId)

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    // Set chart dimensions
    const chartWidth = canvasRef.current.width - 60
    const chartHeight = canvasRef.current.height - 80
    const barWidth = chartWidth / data.length / 4 // Divide by 4 for 3 emotions + gap

    // Draw title
    ctx.fillStyle = "#000"
    ctx.font = "14px Arial"
    ctx.fillText("Desempeño Mensual por Emoción", 20, 20)

    // Draw axes
    ctx.beginPath()
    ctx.moveTo(40, 30)
    ctx.lineTo(40, chartHeight + 30)
    ctx.lineTo(chartWidth + 50, chartHeight + 30)
    ctx.strokeStyle = "#ccc"
    ctx.stroke()

    // Draw y-axis labels
    ctx.fillStyle = "#666"
    ctx.font = "10px Arial"
    ctx.fillText("100%", 10, 30)
    ctx.fillText("50%", 15, chartHeight / 2 + 30)
    ctx.fillText("0%", 20, chartHeight + 30)

    // Draw bars
    const emotions = ["feliz", "triste", "enojado"]
    const colors = {
      feliz: "#4CAF50",
      triste: "#2196F3",
      enojado: "#F44336",
    }

    data.forEach((item, weekIndex) => {
      const weekX = 50 + weekIndex * (barWidth * 4 + 10)

      // Draw each emotion bar
      emotions.forEach((emotion, emotionIndex) => {
        const value = item[emotion]
        const barHeight = (value / 100) * chartHeight
        const x = weekX + emotionIndex * barWidth
        const y = chartHeight + 30 - barHeight

        // Draw bar
        ctx.fillStyle = colors[emotion]
        ctx.fillRect(x, y, barWidth - 2, barHeight)

        // Draw value on top of bar
        ctx.fillStyle = "#000"
        ctx.font = "10px Arial"
        ctx.fillText(`${value}%`, x, y - 5)
      })

      // Draw x-axis label
      ctx.fillStyle = "#666"
      ctx.font = "10px Arial"
      ctx.fillText(item.week, weekX, chartHeight + 45)
    })

    // Draw legend
    const legendY = chartHeight + 60
    emotions.forEach((emotion, index) => {
      const x = 50 + index * 100

      // Draw color box
      ctx.fillStyle = colors[emotion]
      ctx.fillRect(x, legendY, 15, 15)

      // Draw label
      ctx.fillStyle = "#000"
      ctx.font = "12px Arial"
      ctx.fillText(emotion.charAt(0).toUpperCase() + emotion.slice(1), x + 20, legendY + 12)
    })
  }, [patientId])

  return (
    <div className="border rounded-lg p-4 bg-white">
      <canvas ref={canvasRef} width={600} height={300} className="w-full h-auto" />
    </div>
  )
}

