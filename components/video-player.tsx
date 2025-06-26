"use client"

import { useEffect, useRef, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Volume2, VolumeX, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoAd {
  id: string
  videoUrl: string
  title?: string
}

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videos, setVideos] = useState<VideoAd[]>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [showPlayButton, setShowPlayButton] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  // Fetch videos from Firestore
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const videosCollection = collection(db, "video_ads")
        const videosSnapshot = await getDocs(videosCollection)
        const videosData = videosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as VideoAd[]

        if (videosData.length > 0) {
          setVideos(videosData)
        } else {
          setError("No videos found")
        }
      } catch (err) {
        console.error("Error fetching videos:", err)
        setError("Failed to load videos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()
  }, [])

  // Handle video end event
  const handleVideoEnd = () => {
    if (videos.length > 0) {
      setCurrentVideoIndex((prevIndex) => (prevIndex === videos.length - 1 ? 0 : prevIndex + 1))
    }
  }

  // Attempt to play video
  const playVideo = async () => {
    if (!videoRef.current) return

    const video = videoRef.current

    try {
      // First try to play with sound
      video.muted = false
      await video.play()
      setIsMuted(false)
      setShowPlayButton(false)
      setHasUserInteracted(true)
    } catch (error) {
      console.log("Failed to play with sound, trying muted:", error)

      try {
        // If that fails, try muted autoplay
        video.muted = true
        await video.play()
        setIsMuted(true)
        setShowPlayButton(false)

        // Show unmute option after successful muted play
        if (!hasUserInteracted) {
          setTimeout(() => {
            setShowPlayButton(false) // Hide play button since video is playing
          }, 1000)
        }
      } catch (mutedError) {
        console.log("Failed to autoplay even muted:", mutedError)
        setShowPlayButton(true)
      }
    }
  }

  // Handle user click to start video
  const handleUserPlay = async () => {
    setHasUserInteracted(true)
    await playVideo()
  }

  // Toggle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted
      videoRef.current.muted = newMutedState
      setIsMuted(newMutedState)
    }
  }

  // Play video when component mounts or video changes
  useEffect(() => {
    if (videoRef.current && videos.length > 0) {
      const video = videoRef.current
      video.load() // Reload the video element

      const handleLoadedData = () => {
        playVideo()
      }

      video.addEventListener("loadeddata", handleLoadedData)

      return () => {
        video.removeEventListener("loadeddata", handleLoadedData)
      }
    }
  }, [currentVideoIndex, videos])

  // Add click listener to document for first user interaction
  useEffect(() => {
    const handleFirstClick = () => {
      if (!hasUserInteracted && videoRef.current) {
        setHasUserInteracted(true)
        // Try to unmute if video is already playing
        if (!videoRef.current.paused) {
          videoRef.current.muted = false
          setIsMuted(false)
        }
      }
    }

    document.addEventListener("click", handleFirstClick, { once: true })

    return () => {
      document.removeEventListener("click", handleFirstClick)
    }
  }, [hasUserInteracted])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading videos...</p>
        </div>
      </div>
    )
  }

  if (error || videos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <p className="text-red-400 mb-4">{error || "No videos available"}</p>
          <p className="text-sm text-gray-400">Please check your video_ads collection</p>
        </div>
      </div>
    )
  }

  const currentVideo = videos[currentVideoIndex]

  return (
    <div className="h-full relative overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        onEnded={handleVideoEnd}
        playsInline
        preload="metadata"
        controls={false}
        loop={false}
      >
        <source src={currentVideo.videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Play button overlay for initial user interaction */}
      {showPlayButton && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <Button
            onClick={handleUserPlay}
            className="w-20 h-20 rounded-full bg-white/90 hover:bg-white text-black shadow-2xl"
            size="icon"
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>
      )}

      {/* Sound control button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={toggleMute}
          variant="secondary"
          size="icon"
          className="bg-black/50 hover:bg-black/70 text-white border-0 rounded-full"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>

      {/* Video indicator */}
      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
        {currentVideoIndex + 1} / {videos.length}
      </div>

      {/* Video title overlay (optional) */}
      {currentVideo.title && (
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg max-w-xs">
          <p className="text-sm font-medium">{currentVideo.title}</p>
        </div>
      )}

      {/* Muted indicator */}
      {isMuted && !showPlayButton && (
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
          <VolumeX className="w-4 h-4" />
          <span>Tap to unmute</span>
        </div>
      )}
    </div>
  )
}
