"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff } from "lucide-react"

interface CameraCaptureProps {
  isActive: boolean
  onCapture: (imageData: string) => void
  onToggle: () => void
}

export function CameraCapture({ isActive, onCapture, onToggle }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    if (isActive) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => stopCamera()
  }, [isActive])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        const imageData = canvas.toDataURL("image/jpeg", 0.8)
        onCapture(imageData)
      }
    }
  }

  return (
    <div className="h-full bg-gray-900 rounded-3xl overflow-hidden relative">
      {isActive ? (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
            <Button
              onClick={captureImage}
              size="icon"
              className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-gray-900"
            >
              <Camera className="w-8 h-8" />
            </Button>
            <Button onClick={onToggle} size="icon" className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600">
              <CameraOff className="w-6 h-6" />
            </Button>
          </div>
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-center space-y-6 text-white">
          <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
            <Camera className="w-12 h-12" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Camera Ready</h3>
            <p className="text-gray-400">Click to activate camera for bottle detection</p>
          </div>
          <Button onClick={onToggle} className="bg-emerald-500 hover:bg-emerald-600 rounded-2xl px-8 py-3">
            Activate Camera
          </Button>
        </div>
      )}
    </div>
  )
}
