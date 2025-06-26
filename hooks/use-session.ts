"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, setDoc, onSnapshot, updateDoc, increment, serverTimestamp, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { v4 as uuidv4 } from "uuid"

interface User {
  id: string
  displayName: string
  point: number
  photoURL?: string
}

interface SessionData {
  sessionId: string
  status: "pending" | "authorized"
  userId?: string
  createdAt: any
}

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [bottlesDeposited, setBottlesDeposited] = useState(0)
  const [currentStep, setCurrentStep] = useState<"login" | "profile" | "instructions" | "deposit" | "summary">("login")
  const [instructionStep, setInstructionStep] = useState(1)

  const createSession = useCallback(async () => {
    const newSessionId = uuidv4()
    const sessionRef = doc(db, "desktop_sessions", newSessionId)

    await setDoc(sessionRef, {
      sessionId: newSessionId,
      status: "pending",
      createdAt: serverTimestamp(),
    })

    setSessionId(newSessionId)
    setIsLoading(false)

    // Listen for session changes
    const unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SessionData

        if (data.status === "authorized" && data.userId) {
          // Fetch user data
          const userRef = doc(db, "users", data.userId)
          const userUnsubscribe = onSnapshot(userRef, (userSnapshot) => {
            if (userSnapshot.exists()) {
              const userData = userSnapshot.data()
              setUser({
                id: data.userId!,
                displayName: userData.displayName || "User",
                point: userData.point || 0,
                photoURL: userData.photoURL,
              })
              setIsAuthorized(true)
              setCurrentStep("profile")
            }
          })

          return () => userUnsubscribe()
        }
      }
    })

    return unsubscribe
  }, [])

  const savePointsToUser = useCallback(async () => {
    if (!user || bottlesDeposited === 0) return

    const pointsToAdd = bottlesDeposited * 10
    const userRef = doc(db, "users", user.id)

    try {
      await updateDoc(userRef, {
        point: increment(pointsToAdd),
      })

      // Update local user state
      setUser((prev) => (prev ? { ...prev, point: prev.point + pointsToAdd } : null))

      return pointsToAdd
    } catch (error) {
      console.error("Error saving points:", error)
      return 0
    }
  }, [user, bottlesDeposited])

  const logout = useCallback(async () => {
    if (sessionId) {
      // Delete the session from Firebase
      try {
        const sessionRef = doc(db, "desktop_sessions", sessionId)
        await deleteDoc(sessionRef)
      } catch (error) {
        console.error("Error deleting session:", error)
      }
    }

    // Reset all state
    setIsAuthorized(false)
    setBottlesDeposited(0)
    setUser(null)
    setSessionId(null)
    setCurrentStep("login")
    setIsLoading(true)

    // Create new session
    createSession()
  }, [sessionId, createSession])

  const finishSession = useCallback(async () => {
    const pointsAdded = await savePointsToUser()

    // Reset bottles count but keep user logged in
    setBottlesDeposited(0)
    setCurrentStep("profile")

    return pointsAdded
  }, [savePointsToUser])

  const addBottle = useCallback(() => {
    setBottlesDeposited((prev) => prev + 1)
  }, [])

  const startDeposit = useCallback(() => {
    setCurrentStep("instructions")
    setInstructionStep(1)
  }, [])

  const nextInstruction = useCallback(() => {
    if (instructionStep < 4) {
      setInstructionStep((prev) => prev + 1)
    } else {
      setCurrentStep("deposit")
    }
  }, [instructionStep])

  const goToSummary = useCallback(() => {
    setCurrentStep("summary")
  }, [])

  useEffect(() => {
    createSession()
  }, [createSession])

  return {
    sessionId,
    isLoading,
    isAuthorized,
    user,
    bottlesDeposited,
    currentStep,
    instructionStep,
    addBottle,
    finishSession,
    startDeposit,
    nextInstruction,
    goToSummary,
    logout,
    savePointsToUser,
  }
}
