"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Recycle, Camera, Gift, ArrowRight } from "lucide-react"

interface InstructionStepsProps {
  currentStep: number
  onNext: () => void
}

const instructions = [
  {
    icon: Recycle,
    title: "Siapkan Botol Plastik",
    description:
      "Pastikan botol plastik Anda bersih dan dalam kondisi baik. Lepaskan tutup dan label jika memungkinkan.",
    color: "bg-blue-500",
  },
  {
    icon: Camera,
    title: "Posisikan Botol",
    description:
      "Letakkan botol di area yang terang dan posisikan dengan baik agar kamera dapat mendeteksi dengan jelas.",
    color: "bg-emerald-500",
  },
  {
    icon: CheckCircle,
    title: "Verifikasi Deteksi",
    description:
      "Sistem akan mendeteksi jenis dan ukuran botol secara otomatis. Pastikan informasi yang terdeteksi sudah benar.",
    color: "bg-purple-500",
  },
  {
    icon: Gift,
    title: "Mulai Deposit",
    description:
      "Setelah semua siap, Anda dapat mulai memasukkan botol dan mendapatkan poin untuk setiap botol yang dimasukkan.",
    color: "bg-orange-500",
  },
]

export function InstructionSteps({ currentStep, onNext }: InstructionStepsProps) {
  const instruction = instructions[currentStep - 1]
  const Icon = instruction.icon

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center space-x-2">
        {instructions.map((_, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full transition-colors ${
                index + 1 <= currentStep ? "bg-emerald-500" : "bg-gray-200"
              }`}
            />
            {index < instructions.length - 1 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {/* Step Counter */}
      <div className="text-sm font-medium text-gray-500">
        Langkah {currentStep} dari {instructions.length}
      </div>

      {/* Instruction Card */}
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          <div className={`w-20 h-20 ${instruction.color} rounded-3xl flex items-center justify-center mx-auto`}>
            <Icon className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">{instruction.title}</h2>
            <p className="text-gray-600 leading-relaxed">{instruction.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Next Button */}
      <Button
        onClick={onNext}
        className="w-full max-w-md py-4 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 rounded-2xl"
        size="lg"
      >
        <div className="flex items-center justify-center space-x-2">
          <span>{currentStep === 4 ? "Mulai Deposit" : "Lanjut"}</span>
          <ArrowRight className="w-5 h-5" />
        </div>
      </Button>
    </div>
  )
}
