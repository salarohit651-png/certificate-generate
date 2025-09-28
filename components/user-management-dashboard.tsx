"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Edit, Trash2, Link, Search, Users } from "lucide-react"
import { UserEditForm } from "./user-edit-form"
import { toast } from "sonner"

interface User {
  _id: string
  title: string
  name: string
  fatherHusbandName: string
  mobileNo: string
  emailId: string
  dateOfBirth: string
  passoutPercentage: number
  state: string
  address: string
  courseName: string
  experience: string
  collegeName: string
  photoUrl: string
  qrCodeUrl: string
  registrationNumber: string
  createdAt: string
  updatedAt: string
}

export function UserManagementDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [linkGenerating, setLinkGenerating] = useState<string | null>(null) // Track which user's link is being generated
  const router = useRouter()

  const getAuthHeaders = () => {
    return {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    }
  }

  const checkAuth = () => {
    return true
  }

  useEffect(() => {
    fetchUsers()
    const interval = setInterval(fetchUsers, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchUsers = async () => {
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/admin/users?t=${timestamp}&nocache=${Math.random()}`, {
        cache: "no-store",
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      setUsers([])
      toast.error("Failed to fetch users", {
        description: "Please try refreshing the page",
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      const data = await response.json()

      if (data.success) {
        setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId))
        toast.success(data.message || "User deleted successfully")
      } else {
        toast.error(data.message || "Failed to delete user")
      }
    } catch (error) {
      toast.error("Error deleting user", {
        description: "Please try again later",
        duration: 4000,
      })
    }
  }

  const handleGenerateLink = async (user: User) => {
    try {
      setLinkGenerating(user._id)
      const linkToCopy = `${process.env.NEXT_PUBLIC_BASE_URL}/user/login`;

      // Enhanced clipboard functionality
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(linkToCopy)
          toast.success('Link copied to clipboard!')
        } catch (clipboardError) {
          // Fallback to older method
          try {
            const textArea = document.createElement('textarea')
            textArea.value = linkToCopy
            textArea.style.position = 'fixed'
            textArea.style.left = '-999999px'
            textArea.style.top = '-999999px'
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            const successful = document.execCommand('copy')
            document.body.removeChild(textArea)
            
            if (successful) {
              toast.success('Link copied to clipboard!')
            } else {
              throw new Error('Copy command failed')
            }
          } catch (fallbackError) {
            toast.error('Failed to copy link to clipboard')
          }
        }
      } else {
        // Fallback for older browsers or non-secure contexts
        try {
          const textArea = document.createElement('textarea')
          textArea.value = linkToCopy
          textArea.style.position = 'fixed'
          textArea.style.left = '-999999px'
          textArea.style.top = '-999999px'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          const successful = document.execCommand('copy')
          document.body.removeChild(textArea)
          
          if (successful) {
            toast.success('Link copied to clipboard!')
          } else {
            throw new Error('Copy command failed')
          }
        } catch (legacyError) {
          toast.error('Failed to copy link to clipboard')
        }
      }
    } catch (error) {
      toast.error('Failed to generate link')
    } finally {
      setLinkGenerating(null)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(users.map((user) => (user._id === updatedUser._id ? updatedUser : user)))
    setIsEditDialogOpen(false)
    setSelectedUser(null)
    toast.success("User updated successfully")
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.emailId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobileNo.includes(searchTerm) ||
      user.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <div className="text-lg text-gray-600">Loading users...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Badge variant="secondary">{filteredUsers.length} users found</Badge>
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                    Refreshing...
                  </div>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Registration No.</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      {user.title} {user.name}
                    </TableCell>
                    <TableCell>{user.emailId}</TableCell>
                    <TableCell>{user.mobileNo}</TableCell>
                    <TableCell>{user.registrationNumber}</TableCell>
                    <TableCell>{user.courseName}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleGenerateLink(user)}
                          disabled={linkGenerating === user._id}
                        >
                          {linkGenerating === user._id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                          ) : (
                            <Link className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No users found matching your search criteria.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserEditForm
              user={selectedUser}
              onUserUpdated={handleUserUpdated}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
