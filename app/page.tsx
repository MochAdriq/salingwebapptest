"use client";

import { VideoPlayer } from "@/components/video-player";
import { QRCodeComponent } from "@/components/qr-code";
import { useState, useEffect, useCallback } from "react";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { CheckCircle, Smartphone, Wifi } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SessionData {
  sessionId: string;
  status: "pending" | "authorized";
  userId?: string;
  createdAt: any;
}

export default function InitialPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginStep, setLoginStep] = useState<"qr" | "connecting" | "success">(
    "qr"
  );
  const [userName, setUserName] = useState<string>("");
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasUserTapped, setHasUserTapped] = useState(false);

  const createSession = useCallback(async () => {
    // Clear any existing session from localStorage
    localStorage.removeItem("saling_session");

    const newSessionId = uuidv4();
    const sessionRef = doc(db, "desktop_sessions", newSessionId);

    await setDoc(sessionRef, {
      sessionId: newSessionId,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    setSessionId(newSessionId);
    setIsLoading(false);

    // Store session in localStorage
    localStorage.setItem("saling_session", newSessionId);

    // Listen for session changes
    const unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SessionData;

        if (data.status === "authorized" && data.userId) {
          // Show connecting state
          setLoginStep("connecting");

          // Get user data to show name
          const userRef = doc(db, "users", data.userId);
          const userUnsubscribe = onSnapshot(userRef, (userSnapshot) => {
            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              setUserName(userData.displayName || "User");

              // Show success state
              setLoginStep("success");

              // Store session data in localStorage
              localStorage.setItem("saling_session_data", JSON.stringify(data));

              // Redirect to profile page after success animation
              setTimeout(() => {
                router.push(`/profile?session=${newSessionId}`);
              }, 2500);
            }
          });

          return () => userUnsubscribe();
        }
      }
    });

    return unsubscribe;
  }, [router]);

  useEffect(() => {
    createSession();
  }, [createSession]);

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

  // Success Screen
  if (loginStep === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full relative overflow-hidden">
          {/* Confetti Animation */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(15)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Login Berhasil! 🎉
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Selamat datang, {userName}!
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

  // Connecting Screen
  if (loginStep === "connecting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="/images/saling-logo.png"
              alt="Saling.ID Logo"
              className="w-20 h-20 mx-auto object-contain"
            />
          </div>

          {/* Connecting Animation */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-24 h-24 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Wifi className="w-12 h-12 text-white animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Menghubungkan...
          </h2>
          <p className="text-gray-600 mb-6">Sedang memverifikasi login Anda</p>

          {/* Progress Animation */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full animate-pulse w-3/4"></div>
          </div>

          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Smartphone className="w-4 h-4" />
            <span className="text-sm">Terhubung dengan aplikasi mobile</span>
          </div>
        </div>
      </div>
    );
  }

  // QR Code Screen
  return (
    <div className="min-h-screen bg-gray-50 flex" onClick={handleFirstTap}>
      {/* Left side - Video Player (2/3) */}
      <div className="flex-[2] p-6">
        <div className="h-full bg-black rounded-3xl overflow-hidden shadow-xl relative">
          <VideoPlayer />

          {/* Logo Overlay */}
          <div className="absolute top-6 left-6 z-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <img
                src="/images/saling-logo.png"
                alt="Saling.ID - Sahabat Lingkungan"
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>

          {/* Fullscreen Indicator */}
          {isFullscreen && (
            <div className="absolute bottom-6 right-6 z-10">
              <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                <span>Press ESC to exit fullscreen</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - QR Login */}
      <div className="flex-1 p-6 pl-0">
        <div className="h-full bg-white rounded-3xl shadow-xl overflow-hidden flex">
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 min-h-full">
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  Scan & Earn Points
                </h1>
                <p className="text-gray-600 max-w-sm leading-relaxed">
                  Gunakan aplikasi Saling di ponsel Anda untuk memindai kode QR
                  dan mulai mendapatkan poin dari daur ulang.
                </p>
              </div>
            </div>

            <div className="relative">
              {isLoading || !sessionId ? (
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                  <div className="w-56 h-56 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm">
                        Generating QR Code...
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <QRCodeComponent value={sessionId} size={220} />

                  {/* Scanning animation overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse"></div>
                    <div
                      className="absolute bottom-4 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-2xl p-6 max-w-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Smartphone className="w-5 h-5 mr-2 text-emerald-600" />
                Cara Menggunakan
              </h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5 flex-shrink-0">
                    1
                  </span>
                  Buka aplikasi Saling di ponsel
                </li>
                <li className="flex items-start">
                  <span className="bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5 flex-shrink-0">
                    2
                  </span>
                  Pindai kode QR di atas
                </li>
                <li className="flex items-start">
                  <span className="bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5 flex-shrink-0">
                    3
                  </span>
                  Mulai deposit botol & dapatkan poin
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
