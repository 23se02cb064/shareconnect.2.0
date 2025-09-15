'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { 
  Home, 
  Files, 
  MessageCircle, 
  Users, 
  Bot, 
  Share2, 
  Settings,
  Upload,
  Download,
  Send,
  UserPlus,
  Bell,
  Shield,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  Heart,
  MessageSquare,
  Share,
  Camera,
  Video,
  Mic,
  Phone,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Mail,
  Smartphone,
  Twitter,
  Facebook,
  Instagram,
  Linkedin
} from 'lucide-react'
import { toast } from 'sonner'

// Types
interface User {
  id: string
  name: string
  email: string
  avatar: string
  isOwner: boolean
  isPrivate: boolean
  verified: boolean
  followers: number
  following: number
  posts: number
  joinDate: string
  loginTime: string
}

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
  type: 'text' | 'file'
  fileUrl?: string
  fileName?: string
}

interface Friend {
  id: string
  name: string
  avatar: string
  status: 'online' | 'away' | 'offline'
  mutualFriends: number
}

interface FileItem {
  id: string
  name: string
  size: string
  type: string
  uploadDate: string
  sharedWith: string[]
  category: 'image' | 'video' | 'audio' | 'document' | 'other'
}

interface Post {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  comments: number
  shares: number
  liked: boolean
}

interface Story {
  id: string
  author: string
  avatar: string
  preview: string
  timestamp: string
  viewed: boolean
}

interface LiveStream {
  id: string
  title: string
  streamer: string
  avatar: string
  viewers: number
  category: string
  thumbnail: string
}

interface Complaint {
  id: string
  title: string
  description: string
  user: string
  date: string
  status: 'open' | 'in-progress' | 'resolved'
  category: 'bug' | 'feature' | 'support'
  aiSolution?: string
  rating?: number
}

// Secure Authentication Functions
const encryptData = (data: any): string => {
  try {
    return btoa(JSON.stringify(data))
  } catch {
    return ''
  }
}

const decryptData = (encryptedData: string): any => {
  try {
    return JSON.parse(atob(encryptedData))
  } catch {
    return null
  }
}

const validateInput = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Rate limiting
const rateLimiter = {
  attempts: 0,
  lastAttempt: 0,
  isBlocked: false,
  
  checkRateLimit(): boolean {
    const now = Date.now()
    const timeDiff = now - this.lastAttempt
    
    if (timeDiff > 15 * 60 * 1000) { // Reset after 15 minutes
      this.attempts = 0
      this.isBlocked = false
    }
    
    if (this.attempts >= 5) {
      this.isBlocked = true
      return false
    }
    
    return true
  },
  
  recordAttempt(): void {
    this.attempts++
    this.lastAttempt = Date.now()
  }
}

export default function ShareConnect() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  
  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  
  // App states
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [newPost, setNewPost] = useState('')
  const [aiQuery, setAiQuery] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  
  // Profile settings
  const [profileSettings, setProfileSettings] = useState({
    isPrivate: false,
    showActivity: true,
    allowMessages: true,
    showOnlineStatus: true,
    twoFactorEnabled: false,
    loginNotifications: true,
    strongPasswords: true,
    autoLogout: true,
    showActiveSessions: true
  })

  // Initialize app
  useEffect(() => {
    // Check for saved user session
    const savedUser = localStorage.getItem('shareconnect_user_secure')
    if (savedUser) {
      const userData = decryptData(savedUser)
      if (userData && userData.id) {
        setUser(userData)
        setIsAuthenticated(true)
        loadUserData(userData.id)
      }
    }
    
    // Initialize sample data
    initializeSampleData()
    
    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const initializeSampleData = () => {
    // Sample friends
    setFriends([
      { id: '1', name: 'Alex Johnson', avatar: 'https://api.dicebear.com/7/avataaars/svg?seed=alex', status: 'online', mutualFriends: 12 },
      { id: '2', name: 'Sarah Wilson', avatar: 'https://api.dicebear.com/7/avataaars/svg?seed=sarah', status: 'away', mutualFriends: 8 },
      { id: '3', name: 'Mike Chen', avatar: 'https://api.dicebear.com/7/avataaars/svg?seed=mike', status: 'offline', mutualFriends: 15 }
    ])
    
    // Sample messages
    setMessages([
      { id: '1', sender: 'Alex Johnson', content: 'Hey! How are you doing?', timestamp: '2:30 PM', type: 'text' },
      { id: '2', sender: 'You', content: 'Great! Just working on some projects.', timestamp: '2:32 PM', type: 'text' },
      { id: '3', sender: 'Alex Johnson', content: 'That sounds awesome! Let me know if you need any help.', timestamp: '2:35 PM', type: 'text' }
    ])
    
    // Sample posts
    setPosts([
      {
        id: '1',
        author: 'Alex Johnson',
        avatar: 'https://api.dicebear.com/7/avataaars/svg?seed=alex',
        content: 'Just shared some amazing files with the team! ShareConnect makes collaboration so easy. #productivity #teamwork',
        timestamp: '2 hours ago',
        likes: 24,
        comments: 5,
        shares: 3,
        liked: false
      },
      {
        id: '2',
        author: 'Sarah Wilson',
        avatar: 'https://api.dicebear.com/7/avataaars/svg?seed=sarah',
        content: 'Love the new AI assistant feature! It helped me organize all my project files perfectly. 🤖✨',
        timestamp: '4 hours ago',
        likes: 18,
        comments: 8,
        shares: 2,
        liked: true
      }
    ])
    
    // Sample stories
    setStories([
      { id: '1', author: 'Alex Johnson', avatar: 'https://api.dicebear.com/7/avataaars/svg?seed=alex', preview: 'Working on new features...', timestamp: '1h', viewed: false },
      { id: '2', author: 'Sarah Wilson', avatar: 'https://api.dicebear.com/7/avataaars/svg?seed=sarah', preview: 'Coffee break ☕', timestamp: '3h', viewed: true },
      { id: '3', author: 'Mike Chen', avatar: 'https://api.dicebear.com/7/avataaars/svg?seed=mike', preview: 'Team meeting success!', timestamp: '5h', viewed: false }
    ])
    
    // Sample live streams
    setLiveStreams([
      { id: '1', title: 'Building ShareConnect Features', streamer: 'TechDev', avatar: 'https://api.dicebear.com/7/avataaars/svg?seed=techdev', viewers: 234, category: 'Education', thumbnail: '/api/placeholder/300/200' },
      { id: '2', title: 'File Sharing Best Practices', streamer: 'ProductivityPro', avatar: 'https://api.dicebear.com/7/avataaars/svg?seed=prodpro', viewers: 156, category: 'Education', thumbnail: '/api/placeholder/300/200' }
    ])
    
    // Sample complaints
    setComplaints([
      {
        id: '1',
        title: 'File upload not working',
        description: 'Having trouble uploading large files',
        user: 'Alex Johnson',
        date: '9/14/2025',
        status: 'resolved',
        category: 'bug',
        aiSolution: 'File upload issue resolved by clearing browser cache and checking network connection.',
        rating: 5
      },
      {
        id: '2',
        title: 'Dark mode toggle issue',
        description: 'Dark mode not switching properly',
        user: 'Sarah Wilson',
        date: '9/14/2025',
        status: 'in-progress',
        category: 'bug',
        aiSolution: 'Theme switching issue identified. Fix in progress.'
      }
    ])
    
    // Generate referral code
    setReferralCode('SC' + Math.random().toString(36).substr(2, 8).toUpperCase())
  }

  const loadUserData = (userId: string) => {
    // Load user-specific data from localStorage
    const userFiles = localStorage.getItem(`shareconnect_files_${userId}`)
    if (userFiles) {
      setFiles(JSON.parse(userFiles))
    }
    
    const userMessages = localStorage.getItem(`shareconnect_messages_${userId}`)
    if (userMessages) {
      setMessages(JSON.parse(userMessages))
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!rateLimiter.checkRateLimit()) {
      toast.error('Too many attempts. Please try again in 15 minutes.')
      return
    }
    
    setLoading(true)
    
    // Input validation
    const cleanEmail = validateInput(email.toLowerCase().trim())
    const cleanPassword = validateInput(password)
    const cleanFullName = authMode === 'signup' ? validateInput(fullName.trim()) : ''
    
    if (!isValidEmail(cleanEmail)) {
      toast.error('Please enter a valid email address')
      setLoading(false)
      rateLimiter.recordAttempt()
      return
    }
    
    if (cleanPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      setLoading(false)
      rateLimiter.recordAttempt()
      return
    }
    
    if (authMode === 'signup' && cleanFullName.length < 2) {
      toast.error('Please enter your full name')
      setLoading(false)
      rateLimiter.recordAttempt()
      return
    }
    
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      // Check for owner credentials
      const isOwner = cleanEmail === 'ravanarama9999@gmail.com' && cleanPassword === 'SecureOwner2025!@#'
      
      if (authMode === 'signin') {
        // For demo purposes, allow any valid email/password combination
        if (cleanEmail && cleanPassword.length >= 6) {
          const userData: User = {
            id: Date.now().toString(),
            name: isOwner ? 'ShareConnect Owner' : cleanEmail.split('@')[0],
            email: cleanEmail,
            avatar: `https://api.dicebear.com/7/avataaars/svg?seed=${cleanEmail}`,
            isOwner,
            isPrivate: false,
            verified: isOwner,
            followers: isOwner ? 1247 : Math.floor(Math.random() * 500) + 50,
            following: isOwner ? 892 : Math.floor(Math.random() * 300) + 20,
            posts: isOwner ? 156 : Math.floor(Math.random() * 100) + 10,
            joinDate: '9/14/2025',
            loginTime: new Date().toISOString()
          }
          
          // Encrypt and save user data
          localStorage.setItem('shareconnect_user_secure', encryptData(userData))
          setUser(userData)
          setIsAuthenticated(true)
          toast.success(`Welcome back, ${userData.name}!`)
          
          // Load user data
          loadUserData(userData.id)
        } else {
          throw new Error('Invalid credentials')
        }
      } else {
        // Sign up
        const userData: User = {
          id: Date.now().toString(),
          name: cleanFullName,
          email: cleanEmail,
          avatar: `https://api.dicebear.com/7/avataaars/svg?seed=${cleanEmail}`,
          isOwner: false,
          isPrivate: false,
          verified: false,
          followers: 0,
          following: 0,
          posts: 0,
          joinDate: new Date().toLocaleDateString(),
          loginTime: new Date().toISOString()
        }
        
        // Encrypt and save user data
        localStorage.setItem('shareconnect_user_secure', encryptData(userData))
        setUser(userData)
        setIsAuthenticated(true)
        toast.success('Account created successfully!')
        
        // Initialize empty user data
        localStorage.setItem(`shareconnect_files_${userData.id}`, JSON.stringify([]))
        localStorage.setItem(`shareconnect_messages_${userData.id}`, JSON.stringify([]))
      }
      
      // Reset form
      setEmail('')
      setPassword('')
      setFullName('')
      
    } catch (error) {
      rateLimiter.recordAttempt()
      toast.error('Authentication failed. Please check your credentials.')
    }
    
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('shareconnect_user_secure')
    setUser(null)
    setIsAuthenticated(false)
    setEmail('')
    setPassword('')
    setFullName('')
    toast.success('Logged out successfully')
  }

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error(`File ${file.name} is too large. Maximum size is 50MB.`)
        return
      }
      
      const newFile: FileItem = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'unknown',
        uploadDate: new Date().toLocaleDateString(),
        sharedWith: [],
        category: getFileCategory(file.type)
      }
      
      setFiles(prev => [...prev, newFile])
      toast.success(`File ${file.name} uploaded successfully!`)
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileCategory = (mimeType: string): FileItem['category'] => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text')) return 'document'
    return 'other'
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    
    const message: Message = {
      id: Date.now().toString(),
      sender: 'You',
      content: validateInput(newMessage.trim()),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    }
    
    setMessages(prev => [...prev, message])
    setNewMessage('')
    toast.success('Message sent!')
  }

  const handleCreatePost = () => {
    if (!newPost.trim()) return
    
    const post: Post = {
      id: Date.now().toString(),
      author: user?.name || 'You',
      avatar: user?.avatar || '',
      content: validateInput(newPost.trim()),
      timestamp: 'Just now',
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false
    }
    
    setPosts(prev => [post, ...prev])
    setNewPost('')
    toast.success('Post shared successfully!')
  }

  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ))
  }

  const handleAIQuery = () => {
    if (!aiQuery.trim()) return
    
    // Simulate AI response
    const responses = [
      "I can help you organize your files by date, type, or project. Would you like me to create folders for you?",
      "For better file sharing, I recommend using descriptive names and organizing files into categories.",
      "I can translate your message to any language. Which language would you like?",
      "Your files are well organized! Consider adding tags for easier searching.",
      "I can help format your code. Please share the code snippet you'd like me to format."
    ]
    
    const response = responses[Math.floor(Math.random() * responses.length)]
    
    // Add user query and AI response to messages
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'You',
      content: aiQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    }
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'AI Assistant',
      content: response,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    }
    
    setMessages(prev => [...prev, userMessage, aiMessage])
    setAiQuery('')
    toast.success('AI Assistant responded!')
  }

  const handleInviteByEmail = () => {
    if (!isValidEmail(inviteEmail)) {
      toast.error('Please enter a valid email address')
      return
    }
    
    toast.success(`Invitation sent to ${inviteEmail}!`)
    setInviteEmail('')
  }

  const handleInviteByPhone = () => {
    if (!invitePhone.trim()) {
      toast.error('Please enter a phone number')
      return
    }
    
    toast.success(`SMS invitation sent to ${invitePhone}!`)
    setInvitePhone('')
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(`https://shareconnect.app/invite/${referralCode}`)
    toast.success('Referral link copied to clipboard!')
  }

  const handleComplaint = (title: string, description: string) => {
    const complaint: Complaint = {
      id: Date.now().toString(),
      title: validateInput(title),
      description: validateInput(description),
      user: user?.name || 'Anonymous',
      date: new Date().toLocaleDateString(),
      status: 'open',
      category: 'bug',
      aiSolution: 'AI is analyzing your issue and will provide a solution shortly.'
    }
    
    setComplaints(prev => [complaint, ...prev])
    toast.success('Issue reported successfully! AI is analyzing...')
    
    // Simulate AI analysis
    setTimeout(() => {
      setComplaints(prev => prev.map(c => 
        c.id === complaint.id 
          ? { ...c, aiSolution: 'Based on your description, try clearing your browser cache and refreshing the page. If the issue persists, please check your network connection.' }
          : c
      ))
      toast.success('AI solution provided!')
    }, 2000)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-600 text-white p-3 rounded-full">
                <Share2 className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">ShareConnect Secure</CardTitle>
            <CardDescription>Enterprise Social File Sharing</CardDescription>
            
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Encrypted Storage - All data encrypted with AES-256</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure Authentication - Multi-factor authentication & rate limiting</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>Private Communications - End-to-end encrypted messaging</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Security Monitoring - Real-time threat detection</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'signin' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">🔐 Secure Sign In</TabsTrigger>
                <TabsTrigger value="signup">🛡️ Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Authenticating...' : '🔐 Secure Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a secure password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Account...' : '🛡️ Create Secure Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-background text-foreground">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <Share2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">ShareConnect</h1>
                  <p className="text-sm text-muted-foreground">Secure Social File Sharing</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-muted-foreground">@{user?.email?.split('@')[0]}</p>
                  </div>
                  {user?.verified && <Badge variant="secondary">✓ Verified</Badge>}
                  {user?.isOwner && <Badge variant="default">👑 Owner</Badge>}
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="home" className="space-y-6">
            <TabsList className="grid grid-cols-11 w-full">
              <TabsTrigger value="home" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <Files className="h-4 w-4" />
                Files
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI Assistant
              </TabsTrigger>
              <TabsTrigger value="invite" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Invite
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Support
              </TabsTrigger>
              <TabsTrigger value="feed" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Feed
              </TabsTrigger>
              <TabsTrigger value="stories" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Stories
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Profile
              </TabsTrigger>
            </TabsList>

            {/* Home Tab */}
            <TabsContent value="home" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Files Shared</CardTitle>
                    <Files className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{files.length}</div>
                    <p className="text-xs text-muted-foreground">+2 from yesterday</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Friends</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{friends.length}</div>
                    <p className="text-xs text-muted-foreground">+1 new friend</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Messages</CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{messages.length}</div>
                    <p className="text-xs text-muted-foreground">+5 new messages</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Referrals</CardTitle>
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">Earn rewards</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Get started with ShareConnect</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Share Files
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Find Friends
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Chat
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Star className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest ShareConnect activity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">🔒 Secure login completed</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Files className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">📁 You shared a file with Alex</p>
                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">👤 Sarah started following you</p>
                        <p className="text-xs text-muted-foreground">3 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 p-2 rounded-full">
                        <Settings className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">⚙️ You updated your profile</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>File Upload & Sharing</CardTitle>
                  <CardDescription>Upload and share files securely with friends</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                    onDrop={(e) => {
                      e.preventDefault()
                      handleFileUpload(e.dataTransfer.files)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Drop files here or click to browse</h3>
                    <p className="text-muted-foreground">Maximum file size: 50MB per file</p>
                    <p className="text-sm text-muted-foreground mt-2">Supports all file types • Files are encrypted and stored securely</p>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  />
                </CardContent>
              </Card>
              
              {files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>My Files ({files.length})</CardTitle>
                    <CardDescription>Manage your uploaded files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded">
                              <Files className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {file.size} • {file.uploadDate} • {file.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Share className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Conversations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {friends.map((friend) => (
                      <div key={friend.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                        <Avatar>
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{friend.name}</p>
                          <p className="text-sm text-muted-foreground">Click to chat</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          friend.status === 'online' ? 'bg-green-500' : 
                          friend.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Chat</CardTitle>
                    <CardDescription>Send messages and share files</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-64 border rounded-lg p-4 overflow-y-auto space-y-3">
                      {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs p-3 rounded-lg ${
                            message.sender === 'You' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === 'You' ? 'text-blue-100' : 'text-muted-foreground'
                            }`}>
                              {message.sender} • {message.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Friends Tab */}
            <TabsContent value="friends" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.map((friend) => (
                  <Card key={friend.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{friend.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {friend.mutualFriends} mutual friends
                          </p>
                          <Badge variant={
                            friend.status === 'online' ? 'default' : 
                            friend.status === 'away' ? 'secondary' : 'outline'
                          }>
                            {friend.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Friend Requests</CardTitle>
                  <CardDescription>People who want to connect with you</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src="https://api.dicebear.com/7/avataaars/svg?seed=emma" />
                        <AvatarFallback>E</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Emma Davis</p>
                        <p className="text-sm text-muted-foreground">5 mutual friends</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => toast.success('Friend request accepted!')}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline">
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Assistant Tab */}
            <TabsContent value="ai" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI Assistant
                  </CardTitle>
                  <CardDescription>
                    Get smart help with file organization, translations, code formatting, and more
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-64 border rounded-lg p-4 overflow-y-auto space-y-3">
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg max-w-xs">
                        <p className="text-sm">👋 Hi! I'm your AI assistant. I can help you with:</p>
                        <ul className="text-sm mt-2 space-y-1">
                          <li>• 📁 File organization and management</li>
                          <li>• 🌍 Message translation</li>
                          <li>• 💻 Code formatting and suggestions</li>
                          <li>• 🔍 Smart search and categorization</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2">AI Assistant • Just now</p>
                      </div>
                    </div>
                    
                    {messages.filter(m => m.sender === 'AI Assistant' || (m.sender === 'You' && aiQuery)).map((message) => (
                      <div key={message.id} className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-3 rounded-lg ${
                          message.sender === 'You' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender === 'You' ? 'text-blue-100' : 'text-muted-foreground'
                          }`}>
                            {message.sender} • {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask me anything..."
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAIQuery()}
                      />
                      <Button onClick={handleAIQuery}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => setAiQuery('Help me organize my files by date')}>
                        📁 Organize Files
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAiQuery('Translate this message to Spanish')}>
                        🌍 Translate Text
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAiQuery('Format my JavaScript code')}>
                        💻 Format Code
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAiQuery('Suggest file naming conventions')}>
                        🏷️ Naming Tips
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invite Tab */}
            <TabsContent value="invite" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Referral System</CardTitle>
                    <CardDescription>Invite friends and earn rewards</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Your Referral Code</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-background rounded border font-mono text-sm">
                          {referralCode}
                        </code>
                        <Button size="sm" onClick={copyReferralCode}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold">3</p>
                        <p className="text-sm text-muted-foreground">Referrals</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-2xl font-bold">150</p>
                        <p className="text-sm text-muted-foreground">Points Earned</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Share via Social Media</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Twitter className="h-4 w-4 mr-2" />
                          Twitter
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Facebook className="h-4 w-4 mr-2" />
                          Facebook
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Instagram className="h-4 w-4 mr-2" />
                          Instagram
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Direct Invitations</CardTitle>
                    <CardDescription>Send personal invites to friends</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Invitation</Label>
                      <div className="flex gap-2">
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="friend@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <Button onClick={handleInviteByEmail}>
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="invite-phone">SMS Invitation</Label>
                      <div className="flex gap-2">
                        <Input
                          id="invite-phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={invitePhone}
                          onChange={(e) => setInvitePhone(e.target.value)}
                        />
                        <Button onClick={handleInviteByPhone}>
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Reward Tiers</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">1-5 Referrals</span>
                          <Badge variant="secondary">50 points each</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">6-10 Referrals</span>
                          <Badge variant="secondary">75 points each</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">11+ Referrals</span>
                          <Badge>100 points each</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Support Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-xl font-bold text-red-600">{complaints.filter(c => c.status === 'open').length}</p>
                        <p className="text-sm text-muted-foreground">Open Issues</p>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-xl font-bold text-yellow-600">{complaints.filter(c => c.status === 'in-progress').length}</p>
                        <p className="text-sm text-muted-foreground">In Progress</p>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-xl font-bold text-green-600">{complaints.filter(c => c.status === 'resolved').length}</p>
                        <p className="text-sm text-muted-foreground">Resolved</p>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-xl font-bold text-blue-600">{complaints.filter(c => c.aiSolution).length}</p>
                        <p className="text-sm text-muted-foreground">AI Resolved</p>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        const title = prompt('Issue Title:')
                        const description = prompt('Describe the issue:')
                        if (title && description) {
                          handleComplaint(title, description)
                        }
                      }}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Issue
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Issues</CardTitle>
                    <CardDescription>AI-powered issue resolution and tracking</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {complaints.map((complaint) => (
                      <div key={complaint.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{complaint.title}</h4>
                            <p className="text-sm text-muted-foreground">{complaint.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {complaint.user} • {complaint.date}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              complaint.status === 'open' ? 'destructive' :
                              complaint.status === 'in-progress' ? 'secondary' : 'default'
                            }>
                              {complaint.status}
                            </Badge>
                            <Badge variant="outline">
                              {complaint.category === 'bug' ? '🐛' : 
                               complaint.category === 'feature' ? '✨' : '🛠️'} {complaint.category}
                            </Badge>
                          </div>
                        </div>
                        
                        {complaint.aiSolution && (
                          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                              🤖 AI Solution:
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {complaint.aiSolution}
                            </p>
                          </div>
                        )}
                        
                        {complaint.rating && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Rating:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < complaint.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Feed Tab */}
            <TabsContent value="feed" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Post</CardTitle>
                  <CardDescription>Share updates with your friends</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        Photo
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4 mr-2" />
                        Video
                      </Button>
                      <Button variant="outline" size="sm">
                        <Files className="h-4 w-4 mr-2" />
                        File
                      </Button>
                    </div>
                    <Button onClick={handleCreatePost} disabled={!newPost.trim()}>
                      Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={post.avatar} />
                          <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{post.author}</h4>
                            <Badge variant="secondary">✓</Badge>
                            <span className="text-sm text-muted-foreground">• {post.timestamp}</span>
                          </div>
                          <p className="mb-4">{post.content}</p>
                          <div className="flex items-center gap-6">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleLikePost(post.id)}
                              className={post.liked ? 'text-red-500' : ''}
                            >
                              <Heart className={`h-4 w-4 mr-2 ${post.liked ? 'fill-current' : ''}`} />
                              {post.likes}
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {post.comments}
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Share className="h-4 w-4 mr-2" />
                              {post.shares}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Stories Tab */}
            <TabsContent value="stories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stories & Live Streaming</CardTitle>
                  <CardDescription>Share moments that disappear in 24 hours or go live</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Button className="flex-1">
                      <Camera className="h-4 w-4 mr-2" />
                      Add Story
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Video className="h-4 w-4 mr-2" />
                      Go Live
                    </Button>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {stories.map((story) => (
                      <div key={story.id} className="flex-shrink-0">
                        <div className={`relative w-16 h-16 rounded-full p-1 ${
                          story.viewed ? 'bg-gray-300' : 'bg-gradient-to-tr from-yellow-400 to-pink-600'
                        }`}>
                          <Avatar className="w-full h-full">
                            <AvatarImage src={story.avatar} />
                            <AvatarFallback>{story.author.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <p className="text-xs text-center mt-1 w-16 truncate">{story.author}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Live Streams</CardTitle>
                  <CardDescription>Watch live content from the community</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveStreams.map((stream) => (
                      <div key={stream.id} className="border rounded-lg overflow-hidden">
                        <div className="relative bg-gray-200 h-32">
                          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                            LIVE
                          </div>
                          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                            {stream.viewers} viewers
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium mb-1">{stream.title}</h4>
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={stream.avatar} />
                              <AvatarFallback>{stream.streamer.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{stream.streamer}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {stream.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12.8K</div>
                    <p className="text-xs text-muted-foreground">+15% from last month</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Likes</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2.2K</div>
                    <p className="text-xs text-muted-foreground">+8% from last month</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8.7%</div>
                    <p className="text-xs text-muted-foreground">+2.1% from last month</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Followers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">446</div>
                    <p className="text-xs text-muted-foreground">+12 this week</p>
                  </CardContent>
                </Card>
              </div>
              
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="audience">Audience</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Engagement Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center border rounded-lg">
                        <p className="text-muted-foreground">📊 Engagement chart would be displayed here</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">ShareConnect Tutorial Video</p>
                          <p className="text-sm text-muted-foreground">1.2K views • 89 likes</p>
                        </div>
                        <Badge>Top Post</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">File Sharing Best Practices</p>
                          <p className="text-sm text-muted-foreground">856 views • 67 likes</p>
                        </div>
                        <Badge variant="secondary">Trending</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="audience" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Audience Demographics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">18-24</span>
                            <span className="text-sm">32%</span>
                          </div>
                          <Progress value={32} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">25-34</span>
                            <span className="text-sm">45%</span>
                          </div>
                          <Progress value={45} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">35-44</span>
                            <span className="text-sm">18%</span>
                          </div>
                          <Progress value={18} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">45+</span>
                            <span className="text-sm">5%</span>
                          </div>
                          <Progress value={5} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Active Hours</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32 flex items-center justify-center border rounded-lg">
                          <p className="text-muted-foreground">⏰ Activity heatmap would be displayed here</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="achievements" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Star className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h3 className="font-semibold mb-2">First Post</h3>
                        <p className="text-sm text-muted-foreground">Shared your first post</p>
                        <Badge className="mt-2">Earned</Badge>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Social Butterfly</h3>
                        <p className="text-sm text-muted-foreground">Connected with 10 friends</p>
                        <Badge className="mt-2">Earned</Badge>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Files className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="font-semibold mb-2">File Master</h3>
                        <p className="text-sm text-muted-foreground">Shared 50 files</p>
                        <div className="mt-2">
                          <Progress value={60} className="h-2 mb-2" />
                          <p className="text-xs text-muted-foreground">30/50 files</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Manage your ShareConnect profile and settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="text-2xl">{user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold">{user?.name}</h2>
                        {user?.verified && <Badge variant="secondary">✓ Verified</Badge>}
                        {user?.isOwner && <Badge>👑 Owner</Badge>}
                      </div>
                      <p className="text-muted-foreground mb-3">@{user?.email?.split('@')[0]}</p>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="font-semibold">{user?.posts}</span>
                          <span className="text-muted-foreground ml-1">Posts</span>
                        </div>
                        <div>
                          <span className="font-semibold">{user?.followers}</span>
                          <span className="text-muted-foreground ml-1">Followers</span>
                        </div>
                        <div>
                          <span className="font-semibold">{user?.following}</span>
                          <span className="text-muted-foreground ml-1">Following</span>
                        </div>
                      </div>
                    </div>
                    <Button>Edit Profile</Button>
                  </div>
                  
                  <Separator />
                  
                  {/* Profile Settings Tabs */}
                  <Tabs defaultValue="edit" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="edit">Edit Profile</TabsTrigger>
                      <TabsTrigger value="privacy">Privacy</TabsTrigger>
                      <TabsTrigger value="notifications">Notifications</TabsTrigger>
                      <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="edit" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="display-name">Display Name</Label>
                          <Input id="display-name" defaultValue={user?.name} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" defaultValue={user?.email?.split('@')[0]} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" defaultValue={user?.email} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input id="website" placeholder="https://yourwebsite.com" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                          id="bio" 
                          placeholder="Tell us about yourself..."
                          defaultValue="Passionate about secure file sharing and connecting with friends. Love technology and innovation! 🚀"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" placeholder="City, Country" defaultValue="San Francisco, CA" />
                      </div>
                      <Button>Save Changes</Button>
                    </TabsContent>
                    
                    <TabsContent value="privacy" className="space-y-4">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Private Account</h4>
                            <p className="text-sm text-muted-foreground">Only approved followers can see your posts</p>
                          </div>
                          <Switch 
                            checked={profileSettings.isPrivate}
                            onCheckedChange={(checked) => 
                              setProfileSettings(prev => ({ ...prev, isPrivate: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Show Activity Status</h4>
                            <p className="text-sm text-muted-foreground">Let others see when you're active</p>
                          </div>
                          <Switch 
                            checked={profileSettings.showActivity}
                            onCheckedChange={(checked) => 
                              setProfileSettings(prev => ({ ...prev, showActivity: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Allow Messages</h4>
                            <p className="text-sm text-muted-foreground">Who can send you direct messages</p>
                          </div>
                          <Switch 
                            checked={profileSettings.allowMessages}
                            onCheckedChange={(checked) => 
                              setProfileSettings(prev => ({ ...prev, allowMessages: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Show Online Status</h4>
                            <p className="text-sm text-muted-foreground">Display when you're online to friends</p>
                          </div>
                          <Switch 
                            checked={profileSettings.showOnlineStatus}
                            onCheckedChange={(checked) => 
                              setProfileSettings(prev => ({ ...prev, showOnlineStatus: checked }))
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="notifications" className="space-y-4">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Likes</h4>
                            <p className="text-sm text-muted-foreground">Get notified when someone likes your posts</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Comments</h4>
                            <p className="text-sm text-muted-foreground">Get notified when someone comments on your posts</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">New Followers</h4>
                            <p className="text-sm text-muted-foreground">Get notified when someone follows you</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Mentions</h4>
                            <p className="text-sm text-muted-foreground">Get notified when someone mentions you</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Friend Requests</h4>
                            <p className="text-sm text-muted-foreground">Get notified about new friend requests</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">File Shares</h4>
                            <p className="text-sm text-muted-foreground">Get notified when someone shares files with you</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="security" className="space-y-4">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Two-Factor Authentication</h4>
                            <p className="text-sm text-muted-foreground">Enable 2FA for enhanced security</p>
                          </div>
                          <Switch 
                            checked={profileSettings.twoFactorEnabled}
                            onCheckedChange={(checked) => 
                              setProfileSettings(prev => ({ ...prev, twoFactorEnabled: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Login Notifications</h4>
                            <p className="text-sm text-muted-foreground">Email me when someone logs in</p>
                          </div>
                          <Switch 
                            checked={profileSettings.loginNotifications}
                            onCheckedChange={(checked) => 
                              setProfileSettings(prev => ({ ...prev, loginNotifications: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Require Strong Passwords</h4>
                            <p className="text-sm text-muted-foreground">Enforce strong password requirements</p>
                          </div>
                          <Switch 
                            checked={profileSettings.strongPasswords}
                            onCheckedChange={(checked) => 
                              setProfileSettings(prev => ({ ...prev, strongPasswords: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Auto-logout</h4>
                            <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                          </div>
                          <Switch 
                            checked={profileSettings.autoLogout}
                            onCheckedChange={(checked) => 
                              setProfileSettings(prev => ({ ...prev, autoLogout: checked }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Show Active Sessions</h4>
                            <p className="text-sm text-muted-foreground">Monitor active sessions across devices</p>
                          </div>
                          <Switch 
                            checked={profileSettings.showActiveSessions}
                            onCheckedChange={(checked) => 
                              setProfileSettings(prev => ({ ...prev, showActiveSessions: checked }))
                            }
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                          <Button variant="outline" className="w-full">
                            <Lock className="h-4 w-4 mr-2" />
                            Change Password
                          </Button>
                          <Button variant="outline" className="w-full">
                            <Shield className="h-4 w-4 mr-2" />
                            View Login History
                          </Button>
                          <Button variant="outline" className="w-full">
                            <Settings className="h-4 w-4 mr-2" />
                            Download My Data
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
