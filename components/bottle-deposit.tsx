"use client"

import { useState } from "react"
import { CameraCapture } from "./camera-capture"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Recycle, Plus, Trash2, CheckCircle } from "lucide-react"

interface BottleItem {
  id: string
  type: string
  size: string
  image?: string
  points: number
}

interface BottleDepositProps {
  onAddBottle: () => void
  onFinish: () => void
  bottlesDeposited: number
}

export function BottleDeposit({ onAddBottle, onFinish, bottlesDeposited }: BottleDepositProps) {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [detectedBottles, setDetectedBottles] = useState<BottleItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCameraCapture = async (imageData: string) => {
    setIsProcessing(true)

    // Simulate bottle detection processing
    setTimeout(() => {
      const bottleTypes = [
        { type: "Botol Air", size: "500ml", points: 10 },
        { type: "Botol Soda", size: "600ml", points: 12 },
        { type: "Botol Jus", size: "350ml", points: 8 },
      ]

      const randomBottle = bottleTypes[Math.floor(Math.random() * bottleTypes.length)]
      const newBottle: BottleItem = {
        id: Date.now().toString(),
        ...randomBottle,
        image: imageData,
      }

      setDetectedBottles((prev) => [...prev, newBottle])
      setIsProcessing(false)
      setIsCameraActive(false)
    }, 2000)
  }

  const confirmBottle = (bottleId: string) => {
    setDetectedBottles((prev) => prev.filter((bottle) => bottle.id !== bottleId))
    onAddBottle()
  }

  const removeBottle = (bottleId: string) => {
    setDetectedBottles((prev) => prev.filter((bottle) => bottle.id !== bottleId))
  }

  return (
    <div className="h-full flex">
      {/* Left side - Camera */}
      <div className="flex-[2] p-6">
        <CameraCapture
          isActive={isCameraActive}
          onCapture={handleCameraCapture}
          onToggle={() => setIsCameraActive(!isCameraActive)}
        />
      </div>

      {/* Right side - Bottle Management */}
      <div className="flex-1 p-6 pl-0">
        <div className="h-full bg-white rounded-3xl shadow-xl p-6 flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Recycle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Bottle Detection</h2>
            <p className="text-gray-600">Capture bottles to add them to your deposit</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{bottlesDeposited}</div>
                <div className="text-sm text-gray-600">Confirmed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{detectedBottles.length}</div>
                <div className="text-sm text-gray-600">Detected</div>
              </CardContent>
            </Card>
          </div>

          {/* Detected Bottles */}
          <div className="flex-1 space-y-3 overflow-y-auto">
            {isProcessing && (
              <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
                <CardContent className="p-4 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-blue-600 font-medium">Processing bottle...</p>
                </CardContent>
              </Card>
            )}

            {detectedBottles.map((bottle) => (
              <Card key={bottle.id} className="border-2 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{bottle.type}</h3>
                      <p className="text-sm text-gray-600">{bottle.size}</p>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      +{bottle.points} pts
                    </Badge>
                  </div>

                  {bottle.image && (
                    <div className="mb-3">
                      <img
                        src={bottle.image || "/placeholder.svg"}
                        alt="Captured bottle"
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => confirmBottle(bottle.id)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 rounded-xl"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Confirm
                    </Button>
                    <Button onClick={() => removeBottle(bottle.id)} variant="outline" className="rounded-xl" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {detectedBottles.length === 0 && !isProcessing && (
              <div className="text-center py-8 text-gray-500">
                <Recycle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No bottles detected yet</p>
                <p className="text-sm">Activate camera to start detecting bottles</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-6">
            <Button
              onClick={() => setIsCameraActive(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 rounded-2xl py-3"
              disabled={isCameraActive}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add More Bottles
            </Button>

            {bottlesDeposited > 0 && (
              <Button onClick={onFinish} className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-2xl py-3">
                Finish & Claim Points
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
