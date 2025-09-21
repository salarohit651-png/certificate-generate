import { cookies } from "next/headers"

export function checkAdminAuth(): boolean {
  try {
    console.log("[v0] Auth: Checking admin authentication")
    const cookieStore = cookies()
    const adminSession = cookieStore.get("admin-session")

    console.log("[v0] Auth: Admin session cookie:", adminSession)
    console.log("[v0] Auth: Cookie value:", adminSession?.value)

    const isAuthenticated = adminSession?.value === "authenticated"
    console.log("[v0] Auth: Is authenticated:", isAuthenticated)

    return isAuthenticated
  } catch (error) {
    console.error("[v0] Auth: Error checking authentication:", error)
    return false
  }
}

export function clearAdminAuth() {
  const cookieStore = cookies()
  cookieStore.delete("admin-session")
}

export function validateAdminCredentials(username: string, password: string): boolean {
  console.log("[v0] Auth: Validating credentials for username:", username)
  const isValid = username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD
  console.log("[v0] Auth: Credentials valid:", isValid)
  return isValid
}
