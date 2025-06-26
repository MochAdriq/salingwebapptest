"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

interface QRCodeProps {
  value: string
  size?: number
}

export function QRCodeComponent({ value, size = 220 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: "#059669", // emerald-600
          light: "#FFFFFF",
        },
      })
    }
  }, [value, size])

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
      <canvas ref={canvasRef} className="block rounded-2xl" />
    </div>
  )
}
