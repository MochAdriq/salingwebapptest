"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Trash2,
  ArrowLeft,
  Plus,
  CameraOff,
  CheckCircle,
  Trophy,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  doc,
  updateDoc,
  increment,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DetectedBottle {
  id: string;
  type: string;
  size: string;
  points: number;
  image?: string;
  isValid: boolean;
  errorMessage?: string;
}

interface GeminiResponse {
  object: string;
  size: number;
}

export default function CameraPage() {
  const [detectedBottles, setDetectedBottles] = useState<DetectedBottle[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBottles, setConfirmedBottles] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isClaimingPoints, setIsClaimingPoints] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [serialStatus, setSerialStatus] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasUserTapped, setHasUserTapped] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    // Get user ID from session
    const sessionRef = doc(db, "desktop_sessions", sessionId);
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionData = snapshot.data();
        if (sessionData.userId) {
          setUserId(sessionData.userId);
        }
      }
    });

    startCamera();
    return () => {
      stopCamera();
      unsubscribe();
    };
  }, [sessionId, router]);

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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraReady(false);
  };

  const analyzeBottleWithGemini = async (
    imageData: string
  ): Promise<GeminiResponse> => {
    const response = await fetch("/api/analyze-bottle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageData }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze bottle");
    }

    return response.json();
  };

  // Tambahkan tipe manual di atas file ini (atau ke file global types.d.ts)
  interface SerialPort {
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    getInfo(): { usbVendorId?: number; usbProductId?: number };
  }

  interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: "none" | "even" | "odd";
    bufferSize?: number;
    flowControl?: "none" | "hardware";
  }

  interface NavigatorWithSerial extends Navigator {
    serial: {
      requestPort: () => Promise<SerialPort>;
      getPorts: () => Promise<SerialPort[]>;
    };
  }

  // State global (opsional bisa pakai React useRef/useState juga)
  let savedPort: SerialPort | null = null;

  const sendToSerialPorts = async (hasValidSize: boolean) => {
    try {
      const nav = navigator as NavigatorWithSerial;

      if (!("serial" in nav)) {
        console.log("Web Serial API not supported");
        setSerialStatus("Serial API not supported");
        return;
      }

      setSerialStatus("Checking available serial ports...");

      if (!savedPort) {
        const ports = await nav.serial.getPorts();
        if (ports.length > 0) {
          savedPort = ports[0];
          console.log("Using previously granted port.");
        } else {
          setSerialStatus("Requesting access to serial port...");
          savedPort = await nav.serial.requestPort();
          if (!savedPort) {
            setSerialStatus("No port selected");
            return;
          }
        }
      }

      setSerialStatus("Opening serial port...");
      await savedPort.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
      });

      setSerialStatus(
        `Sending ${hasValidSize ? "true" : "false"} to serial port...`
      );

      const writer = savedPort.writable.getWriter();
      const encoder = new TextEncoder();
      const message = `${hasValidSize}\n`;

      await writer.write(encoder.encode(message));
      writer.releaseLock();

      setSerialStatus(`Message sent: ${hasValidSize ? "true" : "false"}`);
      console.log(encoder.encode(message))

      // Optional: close after short delay
      setTimeout(async () => {
        try {
          await savedPort?.close();
          setSerialStatus("Serial port closed");
          savedPort = null; // Reset if you want to re-request next time
        } catch (error) {
          console.error("Error closing serial port:", error);
        }
      }, 10000);
    } catch (error: any) {
      console.error("Serial port error:", error);
      setSerialStatus(`Serial error: ${error.message}`);
      savedPort = null;
    }
  };





  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (context) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      context.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);

      stopCamera();

      try {
        // Analyze with Gemini AI
        const analysis = await analyzeBottleWithGemini(imageData);

        let newBottle: DetectedBottle;
        let hasValidSize = false;

        if (
          analysis.object === "Botol Plastik Air Mineral" &&
          analysis.size > 0
        ) {
          // Valid bottle detected with size
          const points = Math.ceil(analysis.size / 50); // 1 point per 50ml, rounded up
          newBottle = {
            id: Date.now().toString(),
            type: "Botol Plastik Air Mineral",
            size: `${analysis.size}ml`,
            points: points,
            image: imageData,
            isValid: true,
          };
          setConfirmedBottles((prev) => prev + 1);
          hasValidSize = true;

          console.log(
            "Valid bottle with size detected, sending true to serial ports..."
          );
        } else {
          // Invalid object or no size detected
          newBottle = {
            id: Date.now().toString(),
            type: "Objek Tidak Valid",
            size: "N/A",
            points: 0,
            image: imageData,
            isValid: false,
            errorMessage: `Jangan masukkan ${analysis.object}, hanya botol mineral plastik`,
          };
          hasValidSize = false;

          console.log(
            "No valid size detected, sending false to serial ports..."
          );
        }

        // Send appropriate message to serial ports
        await sendToSerialPorts(hasValidSize);

        setDetectedBottles((prev) => [newBottle, ...prev]);
        setIsProcessing(false);
      } catch (error) {
        console.error("Error analyzing bottle:", error);

        // Fallback to error state - no valid size
        const errorBottle: DetectedBottle = {
          id: Date.now().toString(),
          type: "Error Analisis",
          size: "N/A",
          points: 0,
          image: imageData,
          isValid: false,
          errorMessage: "Gagal menganalisis gambar. Silakan coba lagi.",
        };

        // Send false for error case
        console.log("Analysis error, sending false to serial ports...");
        await sendToSerialPorts(false);

        setDetectedBottles((prev) => [errorBottle, ...prev]);
        setIsProcessing(false);
      }
    }
  };

  const removeBottle = (bottleId: string) => {
    const bottleToRemove = detectedBottles.find(
      (bottle) => bottle.id === bottleId
    );
    if (bottleToRemove && bottleToRemove.isValid) {
      setConfirmedBottles((prev) => Math.max(0, prev - 1));
    }
    setDetectedBottles((prev) =>
      prev.filter((bottle) => bottle.id !== bottleId)
    );
  };

  const goBack = () => {
    stopCamera();
    router.push(`/instructions?session=${sessionId}`);
  };

  const finishAndClaimPoints = async () => {
    if (!userId || confirmedBottles === 0) {
      router.push(`/profile?session=${sessionId}`);
      return;
    }

    // Calculate total points from valid bottles only BEFORE showing loading screen
    const totalPoints = detectedBottles
      .filter((bottle) => bottle.isValid)
      .reduce((sum, bottle) => sum + bottle.points, 0);

    // Set the points earned immediately
    setPointsEarned(totalPoints);
    setIsClaimingPoints(true);
    stopCamera();

    try {
      // Simulate processing time for better UX
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Save points to user account
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        point: increment(totalPoints),
      });

      // Save collection history
      const historyRef = doc(
        db,
        "users",
        userId,
        "history",
        Date.now().toString()
      );
      await setDoc(historyRef, {
        sessionId: sessionId,
        bottlesCollected: confirmedBottles,
        bottleDetails: detectedBottles
          .filter((bottle) => bottle.isValid)
          .map((bottle) => ({
            type: bottle.type,
            size: bottle.size,
            points: bottle.points,
          })),
        totalPoints: totalPoints,
        machineId: "SALING-001",
        createdAt: serverTimestamp(),
        timestamp: new Date().toISOString(),
      });

      setIsClaimingPoints(false);
      setShowSuccessScreen(true);

      // Store bottles count in localStorage for reference
      localStorage.setItem(
        "last_bottles_deposited",
        confirmedBottles.toString()
      );
      localStorage.setItem("last_points_earned", totalPoints.toString());

      // Auto redirect to profile after showing success
      setTimeout(() => {
        router.push(`/profile?session=${sessionId}`);
      }, 4000);
    } catch (error) {
      console.error("Error saving points:", error);
      setIsClaimingPoints(false);
      router.push(`/profile?session=${sessionId}`);
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

  // Success Screen Component
  if (showSuccessScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full relative overflow-hidden">
          {/* Confetti Animation */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>

          {/* Success Icon */}
          <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Selamat! 🎉</h1>
          <p className="text-lg text-gray-600 mb-6">Poin berhasil diklaim!</p>

          {/* Points Display */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Trophy className="w-6 h-6 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">
                Poin Diperoleh
              </span>
            </div>
            <div className="text-4xl font-black text-emerald-600 animate-pulse">
              +{pointsEarned}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600">
                {confirmedBottles}
              </div>
              <div className="text-sm text-blue-700">Botol</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-600">
                {pointsEarned}
              </div>
              <div className="text-sm text-green-700">Poin</div>
            </div>
          </div>

          {/* Thank you message */}
          <p className="text-gray-600 text-sm mb-4">
            Terima kasih telah berkontribusi untuk lingkungan yang lebih bersih!
            🌱
          </p>

          {/* Loading indicator */}
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <span className="text-sm ml-2">Menuju profil...</span>
          </div>
        </div>
      </div>
    );
  }

  // Claiming Points Loading Screen
  if (isClaimingPoints) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full">
          {/* Loading Animation */}
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Menyimpan Poin
          </h2>
          <p className="text-gray-600 mb-6">
            Sedang memproses {confirmedBottles} botol...
          </p>

          {/* Progress Animation */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full animate-pulse w-3/4"></div>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-4">
            <div className="text-3xl font-bold text-emerald-600">
              +{pointsEarned}
            </div>
            <div className="text-emerald-700 text-sm">
              Poin akan ditambahkan
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-gray-900 flex p-6 gap-6"
      onClick={handleFirstTap}
    >
      {/* Left Side - Camera Container */}
      <div className="flex-[3] relative bg-black rounded-3xl overflow-hidden shadow-2xl h-full">
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
            <div className="text-center text-white">
              <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-2xl font-bold mb-2">Memproses Deteksi</h3>
              <p className="text-gray-300">Sistem sedang memproses botol...</p>
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Capture Button - Positioned at bottom, not blocking camera */}
        {isCameraReady && !isProcessing && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
            <Button
              onClick={captureImage}
              className="px-12 py-6 rounded-2xl bg-emerald-500/90 hover:bg-emerald-600/90 text-white shadow-lg transition-all duration-300 hover:scale-105 font-bold text-xl backdrop-blur-sm border border-emerald-400/30"
            >
              KUMPULKAN
            </Button>
          </div>
        )}

        {/* Serial Status Indicator */}
        {serialStatus && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm max-w-xs">
            <p className="font-medium">Serial Status:</p>
            <p className="text-xs">{serialStatus}</p>
          </div>
        )}

        {/* Fullscreen Indicator */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
            <p className="font-medium">Press ESC to exit fullscreen</p>
          </div>
        )}

        {/* Camera inactive state */}
        {!isCameraReady && !isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center text-white z-10">
            <div className="text-center">
              <CameraOff className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Kamera Tidak Aktif</h3>
              <p className="text-gray-300">
                Klik "Tambah Botol Lagi" untuk mengaktifkan
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Detection Panel */}
      <div className="flex-1 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Deteksi Botol</h2>
            <Button
              onClick={goBack}
              variant="outline"
              size="sm"
              className="rounded-2xl"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Kembali
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-emerald-50 border-emerald-200 rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600">
                  {confirmedBottles}
                </div>
                <div className="text-sm text-emerald-700 font-medium">
                  Botol Valid
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200 rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {detectedBottles
                    .filter((b) => b.isValid)
                    .reduce((sum, b) => sum + b.points, 0)}
                </div>
                <div className="text-sm text-blue-700 font-medium">
                  Total Poin
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detection Results */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[calc(100vh-300px)]">
          {detectedBottles.map((bottle) => (
            <Card
              key={bottle.id}
              className={`border-2 hover:shadow-lg transition-shadow rounded-2xl ${
                bottle.isValid
                  ? "border-emerald-200"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {bottle.isValid ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <h3
                        className={`font-bold text-lg ${
                          bottle.isValid ? "text-gray-900" : "text-red-900"
                        }`}
                      >
                        {bottle.type}
                      </h3>
                    </div>

                    {bottle.isValid ? (
                      <>
                        <p className="text-gray-600">{bottle.size}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 rounded-xl"
                          >
                            +{bottle.points} poin
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs rounded-xl"
                          >
                            Terverifikasi
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-red-600 text-sm font-medium">
                        {bottle.errorMessage}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => removeBottle(bottle.id)}
                    variant="outline"
                    className="rounded-2xl"
                    size="icon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {bottle.image && (
                  <div className="mb-2">
                    <img
                      src={bottle.image || "/placeholder.svg"}
                      alt="Captured bottle"
                      className="w-full h-24 object-cover rounded-2xl border border-gray-200"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Add More Bottle Button */}
          <Card
            className={`border-2 border-dashed transition-all cursor-pointer hover:shadow-md rounded-2xl ${
              isCameraReady || isProcessing
                ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                : "border-emerald-400 bg-white hover:border-emerald-500 hover:bg-emerald-50"
            }`}
            onClick={!isCameraReady && !isProcessing ? startCamera : undefined}
          >
            <CardContent className="p-6 text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors ${
                  isCameraReady || isProcessing
                    ? "bg-gray-200 text-gray-400"
                    : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                }`}
              >
                <Plus className="w-8 h-8" />
              </div>
              <h3
                className={`font-semibold mb-2 ${
                  isCameraReady || isProcessing
                    ? "text-gray-400"
                    : "text-gray-700 hover:text-emerald-700"
                }`}
              >
                {isCameraReady
                  ? "Kamera Aktif"
                  : isProcessing
                  ? "Menganalisis..."
                  : "Tambah Botol Lagi"}
              </h3>
              <p
                className={`text-sm ${
                  isCameraReady || isProcessing
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                {isCameraReady
                  ? "Gunakan tombol kamera untuk mengambil foto"
                  : isProcessing
                  ? "Sistem sedang memproses gambar"
                  : "Klik untuk mengaktifkan kamera"}
              </p>
            </CardContent>
          </Card>

          {detectedBottles.length === 0 && !isProcessing && (
            <div className="text-center py-8 text-gray-500">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-2">Belum Ada Deteksi</h3>
              <p className="text-sm">Ambil foto botol untuk deteksi otomatis</p>
            </div>
          )}
        </div>

        {/* Finish Button */}
        {confirmedBottles > 0 && (
          <div className="p-6 border-t border-gray-100">
            <Button
              onClick={finishAndClaimPoints}
              disabled={isClaimingPoints}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 rounded-2xl py-6 font-bold text-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] min-h-[80px]"
            >
              <div className="flex items-center justify-center space-x-3">
                <Sparkles className="w-6 h-6" />
                <span>
                  Selesai & Klaim{" "}
                  {detectedBottles
                    .filter((b) => b.isValid)
                    .reduce((sum, b) => sum + b.points, 0)}{" "}
                  Poin
                </span>
              </div>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
