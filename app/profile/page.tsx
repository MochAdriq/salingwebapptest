"use client";

import { VideoPlayer } from "@/components/video-player";
import { UserProfile } from "@/components/user-profile";
import { useState, useEffect } from "react";
import { doc, onSnapshot, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  displayName: string;
  point: number;
  photoURL?: string;
}

interface SessionData {
  sessionId: string;
  status: "pending" | "authorized";
  userId?: string;
  createdAt: any;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasUserTapped, setHasUserTapped] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionFromUrl = searchParams.get("session");
    const sessionFromStorage = localStorage.getItem("saling_session");
    const currentSessionId = sessionFromUrl || sessionFromStorage;

    if (!currentSessionId) {
      router.push("/");
      return;
    }

    setSessionId(currentSessionId);

    let userUnsubscribe: (() => void) | null = null;

    // Listen to session changes to get user data
    const sessionRef = doc(db, "desktop_sessions", currentSessionId);
    const sessionUnsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionData = snapshot.data() as SessionData;

        if (sessionData.status === "authorized" && sessionData.userId) {
          // Clean up previous user listener if it exists
          if (userUnsubscribe) {
            userUnsubscribe();
          }

          // Listen to user data changes
          const userRef = doc(db, "users", sessionData.userId);
          userUnsubscribe = onSnapshot(userRef, (userSnapshot) => {
            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              setUser({
                id: sessionData.userId!,
                displayName: userData.displayName || "User",
                point: userData.point || 0,
                photoURL: userData.photoURL,
              });
              setIsLoading(false);
            }
          });
        }
      } else {
        // Session doesn't exist, redirect to initial page
        router.push("/");
      }
    });

    // Cleanup function
    return () => {
      sessionUnsubscribe();
      if (userUnsubscribe) {
        userUnsubscribe();
      }
    };
  }, [searchParams, router]);

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

  const handleStartDeposit = () => {
    if (sessionId) {
      router.push(`/instructions?session=${sessionId}`);
    }
  };

  const handleFinishSession = async () => {
    if (sessionId) {
      try {
        // Delete session from Firebase
        const sessionRef = doc(db, "desktop_sessions", sessionId);
        await deleteDoc(sessionRef);
      } catch (error) {
        console.error("Error deleting session:", error);
      }

      // Clear localStorage
      localStorage.removeItem("saling_session");
      localStorage.removeItem("saling_session_data");

      // Redirect to initial page
      router.push("/");
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User not found. Redirecting...</p>
        </div>
      </div>
    );
  }

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

      {/* Right side - User Profile */}
      <div className="flex-1 p-6 pl-0">
        <div className="h-full bg-white rounded-3xl shadow-xl overflow-hidden">
          <UserProfile
            user={user}
            onStartDeposit={handleStartDeposit}
            onFinishSession={handleFinishSession}
            showBothButtons={true}
          />
        </div>
      </div>
    </div>
  );
}
