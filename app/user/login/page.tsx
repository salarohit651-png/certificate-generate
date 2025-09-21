"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UserLogin() {
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get("error")
    const token = searchParams.get("token")

    if (errorParam === "session_exists" && token) {
      setError(
        "You already have an active session for this profile. Please use a different browser or clear your session.",
      )
    } else if (errorParam === "invalid_or_used_link") {
      setError(
        "The access link you used is invalid, expired, or has already been used. Please login to generate a new link.",
      )
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("[v0] User login attempt:", { email, phoneNumber: phoneNumber.substring(0, 3) + "****" })

      const response = await fetch("/api/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, phoneNumber }),
      })

      const data = await response.json()
      console.log("[v0] Login response:", { success: response.ok, hasProfileLink: !!data.profileLink })

      if (response.ok) {
        console.log("[v0] Login successful, redirecting to profile")
        if (data.profileLink && data.token) {
          sessionStorage.setItem("userToken", data.token)
          sessionStorage.setItem("userEmail", email)
          window.location.href = data.profileLink
        } else {
          setError("Login successful but profile link not found")
        }
      } else {
        console.log("[v0] Login failed:", data.error)
        setError(data.error || "Login failed")
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">User Login</CardTitle>
          <CardDescription>Enter your email and phone number to access your profile</CardDescription>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Each login generates a new one-time access link. Previous links will become
              invalid.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="Enter your phone number"
                maxLength={10}
              />
              <p className="text-sm text-gray-600">Use your registered phone number as password</p>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
