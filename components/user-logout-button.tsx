"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserLogoutButtonProps {
  token?: string
}

export function UserLogoutButton({ token }: UserLogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      if (token) {
        // Call logout API to invalidate the token
        const response = await fetch("/api/user/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })



        sessionStorage.removeItem(`user_session_${token}`)
      }
      
      sessionStorage.removeItem("userToken")
      sessionStorage.removeItem("userEmail")
      router.push("/user/login")
    } catch (error) {
      // Still redirect to login even if API call fails
      router.push("/user/login")
    }
  }

  return (
    <Button onClick={handleLogout} variant="outline" size="sm" className="bg-white/90 hover:bg-white shadow-lg">
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  )
}
