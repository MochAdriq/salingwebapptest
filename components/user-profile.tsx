"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, LogOut, Trophy, Star, Play } from "lucide-react"

interface User {
  displayName: string
  point: number
  photoURL?: string
}

interface UserProfileProps {
  user: User
  onStartDeposit: () => void
  onFinishSession: () => void
  showBothButtons?: boolean
}

export function UserProfile({ user, onStartDeposit, onFinishSession, showBothButtons = false }: UserProfileProps) {
  return (
    <div className="flex-1 flex flex-col p-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Profil Pengguna</h1>
      </div>

      {/* User Profile */}
      <div className="text-center space-y-4">
        <Avatar className="w-32 h-32 mx-auto ring-4 ring-emerald-100 shadow-lg">
          <AvatarImage src={user.photoURL || "/placeholder.svg"} />
          <AvatarFallback className="text-4xl bg-emerald-500 text-white">
            {user.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">{user.displayName}</h2>
          <div className="flex items-center justify-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <p className="text-emerald-600 font-semibold text-lg">Eco Warrior</p>
          </div>
        </div>
      </div>

      {/* Points Display */}
      <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-0 shadow-lg rounded-3xl">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Trophy className="w-8 h-8 text-emerald-600" />
            <h3 className="text-2xl font-bold text-gray-900">Total Poin</h3>
          </div>

          <div className="text-6xl font-black text-emerald-600 mb-4">{user.point.toLocaleString("id-ID")}</div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((user.point / 1000) * 100, 100)}%` }}
            ></div>
          </div>

          <p className="text-gray-600 text-sm">
            {user.point < 1000
              ? `${1000 - user.point} poin lagi untuk mencapai level berikutnya`
              : "Selamat! Anda telah mencapai level maksimum!"}
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex-1 flex flex-col justify-end space-y-6">
        {showBothButtons ? (
          <>
            <Button
              onClick={onStartDeposit}
              className="w-full py-8 text-2xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] min-h-[80px]"
              size="lg"
            >
              <div className="flex items-center justify-center space-x-4">
                <Play className="w-8 h-8" />
                <span>Mulai</span>
              </div>
            </Button>

            <Button
              onClick={onFinishSession}
              variant="outline"
              className="w-full py-6 text-xl font-semibold rounded-3xl border-2 hover:bg-gray-50 min-h-[70px]"
              size="lg"
            >
              <div className="flex items-center justify-center space-x-3">
                <LogOut className="w-6 h-6" />
                <span>Selesai</span>
              </div>
            </Button>
          </>
        ) : (
          <Button
            onClick={onStartDeposit}
            className="w-full py-8 text-2xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] min-h-[80px]"
            size="lg"
          >
            <div className="flex items-center justify-center space-x-4">
              <Sparkles className="w-8 h-8" />
              <span>Mulai Deposit Botol</span>
            </div>
          </Button>
        )}
      </div>
    </div>
  )
}
