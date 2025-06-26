"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Recycle,
  Camera,
  Gift,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const instructions = [
  {
    icon: Recycle,
    title: "Siapkan Botol Plastik",
    description: "Pastikan botol plastik Anda bersih dan dalam kondisi baik.",
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    tips: ["Botol harus bersih", "Lepas tutup botol", "Hindari botol rusak"],
  },
  {
    icon: Camera,
    title: "Posisikan dengan Baik",
    description: "Letakkan botol dan posisikan dengan baik.",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    tips: ["Letakkan botol", "Posisi pas", "Botol bersih"],
  },
  {
    icon: CheckCircle,
    title: "Verifikasi Deteksi",
    description:
      "Sistem akan mendeteksi jenis dan ukuran botol secara otomatis",
    color: "bg-purple-500",
    bgColor: "bg-purple-50",
    tips: ["Periksa jenis botol", "Konfirmasi ukuran", "Validasi deteksi"],
  },
  {
    icon: Gift,
    title: "Mulai Deposit",
    description:
      "Pastikan informasi yang terdeteksi sudah benar sebelum melanjutkan.",
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
    tips: ["Dapatkan poin", "Proses otomatis", "Pantau progress"],
  },
];

export default function InstructionsPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasUserTapped, setHasUserTapped] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const instruction = instructions[currentStep - 1];
  const Icon = instruction.icon;
  const progress = (currentStep / instructions.length) * 100;

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      router.push(`/camera${sessionId ? `?session=${sessionId}` : ""}`);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.push(`/profile${sessionId ? `?session=${sessionId}` : ""}`);
    }
  };

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error("Error entering fullscreen:", error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }
  };

  const handleFirstTap = async () => {
    if (!hasUserTapped) {
      setHasUserTapped(true);
      await enterFullscreen();
    }
  };

  // Fullscreen functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        exitFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8"
      onClick={handleFirstTap}
    >
      <div className="max-w-6xl mx-auto h-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Panduan Deposit Botol
          </h1>
          <Progress
            value={progress}
            className="w-full max-w-md mx-auto h-2 sm:h-3"
          />
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Langkah {currentStep} dari {instructions.length}
          </p>
        </div>

        {/* Fullscreen Indicator */}
        {isFullscreen && (
          <div className="fixed top-4 right-4 z-50 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
            <p className="font-medium">Press ESC to exit fullscreen</p>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 lg:p-12 mb-6 sm:mb-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            {/* Left Side - Icon and Title */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 ${instruction.color} rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto lg:mx-0 mb-4 sm:mb-6 shadow-lg`}
              >
                <Icon className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white" />
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                {instruction.title}
              </h2>
              <p className="text-base sm:text-lg lg:text-lg text-gray-600 leading-relaxed mb-4 sm:mb-6">
                {instruction.description}
              </p>

              {/* Tips */}
              <div
                className={`${instruction.bgColor} rounded-xl sm:rounded-2xl p-4 sm:p-6`}
              >
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-center lg:justify-start">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Tips Penting
                </h3>
                <ul className="space-y-2">
                  {instruction.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="flex items-center text-gray-700 text-sm sm:text-base"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Side - Visual */}
            <div className="flex justify-center order-1 lg:order-2">
              <div className="relative">
                <div
                  className={`w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 ${instruction.bgColor} rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-inner`}
                >
                  <Icon
                    className={`w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:w-32 ${instruction.color.replace(
                      "bg-",
                      "text-"
                    )} opacity-20`}
                  />
                </div>

                {/* Floating elements for visual appeal */}
                <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-4 h-4 sm:w-6 sm:h-6 bg-pink-400 rounded-full animate-pulse"></div>
                <div className="absolute top-1/2 -left-4 sm:-left-8 w-3 h-3 sm:w-4 sm:h-4 bg-blue-400 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          {/* Back Button */}
          <Button
            onClick={handlePrev}
            variant="outline"
            className="w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-4 sm:py-5 lg:py-6 rounded-xl sm:rounded-2xl text-base sm:text-lg lg:text-xl font-semibold min-h-[60px] sm:min-h-[70px] lg:min-h-[80px]"
            size="lg"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            {currentStep === 1 ? "Kembali" : "Sebelumnya"}
          </Button>

          {/* Step indicators */}
          <div className="flex space-x-2 sm:space-x-3 order-first sm:order-none">
            {instructions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index + 1)}
                className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl font-bold transition-all text-sm sm:text-base lg:text-lg ${
                  index + 1 === currentStep
                    ? "bg-emerald-500 text-white shadow-lg scale-110"
                    : index + 1 < currentStep
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <Button
            onClick={handleNext}
            className="w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-4 sm:py-5 lg:py-6 rounded-xl sm:rounded-2xl text-base sm:text-lg lg:text-xl font-semibold bg-emerald-500 hover:bg-emerald-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] min-h-[60px] sm:min-h-[70px] lg:min-h-[80px]"
            size="lg"
          >
            {currentStep === 4 ? "Mulai" : "Lanjut"}
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
