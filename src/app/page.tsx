'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Star, MessageSquare, Camera, MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Home() {
  const [view, setView] = useState<'landing' | 'feedback' | 'admin' | 'staff' | 'management'>('landing')
  const [toiletData, setToiletData] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [selectedIssue, setSelectedIssue] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Admin dashboard state
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [adminLoading, setAdminLoading] = useState(true)
  const [adminActiveTab, setAdminActiveTab] = useState<'overview' | 'analytics' | 'alerts'>('overview')
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [alertsData, setAlertsData] = useState<any>(null)
  const [alertsLoading, setAlertsLoading] = useState(false)

  // Staff portal state
  const [assignedToilets, setAssignedToilets] = useState<any[]>([])
  const [staffLoading, setStaffLoading] = useState(true)
  const [cleaningChecklist, setCleaningChecklist] = useState<string[]>([])
  const [selectedToilet, setSelectedToilet] = useState<any>(null)
  const [cleaningNotes, setCleaningNotes] = useState('')
  const [isSubmittingCleaning, setIsSubmittingCleaning] = useState(false)

  // Management portal state
  const [companies, setCompanies] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [floors, setFloors] = useState<any[]>([])
  const [managementLoading, setManagementLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'companies' | 'locations' | 'floors' | 'toilets' | 'staff'>('companies')

  // Check if we have a QR code in the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const qrCode = urlParams.get('qr')
    const admin = urlParams.get('admin')
    
    if (admin === 'true') {
      setView('admin')
    } else if (qrCode) {
      // Fetch toilet data by QR code
      const fetchToiletData = async () => {
        try {
          const response = await fetch(`/api/toilets?qr=${qrCode}`)
          const data = await response.json()
          
          if (response.ok && data.toilets.length > 0) {
            const toilet = data.toilets[0]
            setToiletData({
              id: toilet.id,
              location: `${toilet.floor.location.name} - Floor ${toilet.floor.name}`,
              toiletNumber: toilet.toiletNumber,
              lastCleaned: toilet.lastCleanedAt,
              nextCleaning: toilet.nextCleaningDue,
              averageRating: toilet.averageRating || 0,
            })
            setView('feedback')
          } else {
            toast({
              title: "Invalid QR Code",
              description: "This QR code is not registered in our system.",
              variant: "destructive"
            })
            window.history.pushState({}, '', '/')
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to fetch toilet information. Please try again.",
            variant: "destructive"
          })
          window.history.pushState({}, '', '/')
        }
      }
      
      fetchToiletData()
    }
  }, [])

  // Admin dashboard data fetch
  useEffect(() => {
    if (view === 'admin') {
      const fetchDashboardData = async () => {
        try {
          const response = await fetch('/api/dashboard')
          const data = await response.json()
          if (response.ok) {
            setDashboardData(data)
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error)
        } finally {
          setAdminLoading(false)
        }
      }

      fetchDashboardData()
    }
  }, [view])

  // Analytics data fetch
  useEffect(() => {
    if (view === 'admin' && adminActiveTab === 'analytics') {
      const fetchAnalyticsData = async () => {
        setAnalyticsLoading(true)
        try {
          const response = await fetch('/api/analytics?type=overview&period=7d')
          const data = await response.json()
          if (response.ok) {
            setAnalyticsData(data)
          }
        } catch (error) {
          console.error('Error fetching analytics data:', error)
        } finally {
          setAnalyticsLoading(false)
        }
      }

      fetchAnalyticsData()
    }
  }, [view, adminActiveTab])

  // Alerts data fetch
  useEffect(() => {
    if (view === 'admin' && adminActiveTab === 'alerts') {
      const fetchAlertsData = async () => {
        setAlertsLoading(true)
        try {
          const response = await fetch('/api/alerts')
          const data = await response.json()
          if (response.ok) {
            setAlertsData(data)
          }
        } catch (error) {
          console.error('Error fetching alerts data:', error)
        } finally {
          setAlertsLoading(false)
        }
      }

      fetchAlertsData()
    }
  }, [view, adminActiveTab])

  // Staff portal data fetch
  useEffect(() => {
    if (view === 'staff') {
      const fetchAssignedToilets = async () => {
        try {
          // For demo, we'll fetch all toilets and show them as assigned
          const response = await fetch('/api/toilets')
          const data = await response.json()
          if (response.ok) {
            setAssignedToilets(data.toilets)
          }
        } catch (error) {
          console.error('Error fetching assigned toilets:', error)
        } finally {
          setStaffLoading(false)
        }
      }

      fetchAssignedToilets()
    }
  }, [view])

  // Management portal data fetch
  useEffect(() => {
    if (view === 'management') {
      const fetchManagementData = async () => {
        try {
          // Fetch all data types
          const [companiesRes, locationsRes, floorsRes] = await Promise.all([
            fetch('/api/companies'),
            fetch('/api/locations'),
            fetch('/api/floors'),
          ])

          const [companiesData, locationsData, floorsData] = await Promise.all([
            companiesRes.json(),
            locationsRes.json(),
            floorsRes.json(),
          ])

          if (companiesRes.ok) setCompanies(companiesData.companies)
          if (locationsRes.ok) setLocations(locationsData.locations)
          if (floorsRes.ok) setFloors(floorsData.floors)
        } catch (error) {
          console.error('Error fetching management data:', error)
        } finally {
          setManagementLoading(false)
        }
      }

      fetchManagementData()
    }
  }, [view])

  const issueTypes = [
    { value: 'DIRTY_FLOOR', label: 'Dirty Floor', icon: '🧹' },
    { value: 'BAD_SMELL', label: 'Bad Smell', icon: '👃' },
    { value: 'NO_WATER', label: 'No Water', icon: '💧' },
    { value: 'NO_SOAP', label: 'No Soap', icon: '🧼' },
    { value: 'NO_TISSUE', label: 'No Tissue', icon: '🧻' },
    { value: 'BROKEN_FIXTURES', label: 'Broken Fixtures', icon: '🔧' },
    { value: 'WET_FLOOR', label: 'Wet Floor', icon: '💦' },
    { value: 'TRASH_OVERFLOW', label: 'Trash Overflow', icon: '🗑️' },
    { value: 'OTHER', label: 'Other', icon: '⚠️' }
  ]

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toiletId: toiletData.id,
          rating,
          issueType: selectedIssue || null,
          comment: comment || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setIsSubmitting(false)
      toast({
        title: "Thank You!",
        description: "Your feedback has been submitted successfully.",
      })
      
      // Reset form
      setRating(0)
      setSelectedIssue('')
      setComment('')
      
      // Redirect to landing after 2 seconds
      setTimeout(() => {
        setView('landing')
        setToiletData(null)
        window.history.pushState({}, '', '/')
      }, 2000)
    } catch (error) {
      setIsSubmitting(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit feedback. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (view === 'feedback' && toiletData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <div className="text-2xl">🚽</div>
              </div>
              <CardTitle className="text-xl text-green-800">CleanIndia QR</CardTitle>
              <CardDescription>
                Help us maintain hygiene standards
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Toilet Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{toiletData.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="text-lg">🚻</div>
                  <span> Toilet {toiletData.toiletNumber}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      Last cleaned: {toiletData.lastCleaned ? 
                        `${Math.round((Date.now() - new Date(toiletData.lastCleaned).getTime()) / (1000 * 60 * 60))} hours ago` : 
                        'Unknown'
                      }
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-green-700 bg-green-100">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Clean
                  </Badge>
                </div>
                {toiletData.averageRating > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Average Rating: {toiletData.averageRating.toFixed(1)}/5</span>
                  </div>
                )}
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-3">How would you rate the hygiene?</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`transition-all ${star <= rating ? 'text-yellow-400 scale-110' : 'text-gray-300 hover:text-yellow-200'}`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center mt-2 text-sm text-gray-600">
                    {rating <= 2 ? 'Poor - Needs attention' : rating === 3 ? 'Average - Could be better' : 'Good - Well maintained'}
                  </p>
                )}
              </div>

              {/* Issues */}
              {rating <= 3 && (
                <div>
                  <label className="block text-sm font-medium mb-3">What issues did you notice?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {issueTypes.map((issue) => (
                      <button
                        key={issue.value}
                        onClick={() => setSelectedIssue(issue.value)}
                        className={`p-3 rounded-lg border transition-all text-center ${
                          selectedIssue === issue.value
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-xl mb-1">{issue.icon}</div>
                        <div className="text-xs">{issue.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">Additional Comments (Optional)</label>
                <Textarea
                  placeholder="Tell us more about your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              {/* Photo Upload */}
              <div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast({ title: "Photo Upload", description: "Photo upload feature coming soon!" })}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Add Photo (Optional)
                </Button>
              </div>

              {/* Submit */}
              <Button 
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>

              {/* Trust Badge */}
              <div className="text-center pt-4 border-t">
                <Badge variant="outline" className="text-green-700 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Maintained by CleanIndia QR
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (view === 'admin') {
    if (adminLoading) {
      return (
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      )
    }

    const stats = dashboardData?.stats || {
      totalToilets: 24,
      averageRating: 4.2,
      todaysFeedback: 18,
      overdueCleanings: 3,
    }

    const recentFeedback = dashboardData?.recentFeedback || []

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CleanIndia QR Admin</h1>
            <p className="text-gray-600">Smart Toilet Monitoring Dashboard</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setAdminActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    adminActiveTab === 'overview'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setAdminActiveTab('analytics')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    adminActiveTab === 'analytics'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Analytics & Reports
                </button>
                <button
                  onClick={() => setAdminActiveTab('alerts')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                    adminActiveTab === 'alerts'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Alerts
                  {alertsData?.summary?.critical > 0 && (
                    <span className="absolute -top-1 -right-2 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {alertsData.summary.critical}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {adminActiveTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Toilets</p>
                        <p className="text-2xl font-bold">{stats.totalToilets}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="text-xl">🚽</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Rating</p>
                        <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Today's Feedback</p>
                        <p className="text-2xl font-bold">{stats.todaysFeedback}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Need Cleaning</p>
                        <p className="text-2xl font-bold text-red-600">{stats.overdueCleanings}</p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentFeedback.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No feedback received yet</p>
                  ) : (
                    <div className="space-y-4">
                      {recentFeedback.map((feedback: any) => (
                        <div key={feedback.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{feedback.toilet.location} - Toilet {feedback.toilet.toiletNumber}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`w-4 h-4 ${star <= feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">
                                {new Date(feedback.createdAt).toLocaleString()}
                              </span>
                              {feedback.issueType && (
                                <Badge variant="outline" className="text-xs">
                                  {feedback.issueType.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                            {feedback.comment && (
                              <p className="text-sm text-gray-600 mt-2">{feedback.comment}</p>
                            )}
                          </div>
                          <Badge variant={feedback.rating <= 2 ? "destructive" : "secondary"}>
                            {feedback.rating <= 2 ? "Action Needed" : "Good"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {adminActiveTab === 'alerts' && (
            <div className="space-y-6">
              {alertsLoading ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading alerts...</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Alert Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                            <p className="text-2xl font-bold">{alertsData?.summary?.total || 0}</p>
                          </div>
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-gray-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Critical</p>
                            <p className="text-2xl font-bold text-red-600">{alertsData?.summary?.critical || 0}</p>
                          </div>
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <div className="text-xl">🚨</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">High Priority</p>
                            <p className="text-2xl font-bold text-orange-600">{alertsData?.summary?.high || 0}</p>
                          </div>
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <div className="text-xl">⚠️</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Medium Priority</p>
                            <p className="text-2xl font-bold text-yellow-600">{alertsData?.summary?.medium || 0}</p>
                          </div>
                          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <div className="text-xl">🔔</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Active Alerts */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Active Alerts</CardTitle>
                        <Button size="sm" variant="outline">Refresh</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {alertsData?.alerts?.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">✅</div>
                          <p className="text-gray-600">No active alerts</p>
                          <p className="text-sm text-gray-500">All systems are operating normally</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {alertsData?.alerts?.map((alert: any) => (
                            <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                              alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                              alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                              alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                              'border-blue-500 bg-blue-50'
                            }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium">{alert.title}</h4>
                                    <Badge variant={
                                      alert.severity === 'critical' ? 'destructive' :
                                      alert.severity === 'high' ? 'destructive' :
                                      alert.severity === 'medium' ? 'secondary' : 'outline'
                                    }>
                                      {alert.severity.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>📍 {alert.location}</span>
                                    <span>🚽 {alert.toiletNumber}</span>
                                    <span>🕐 {new Date(alert.createdAt).toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <Button size="sm" variant="outline">View Details</Button>
                                  <Button size="sm">Acknowledge</Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Alert Types Legend */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Alert Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl">🌟</div>
                          <div>
                            <p className="font-medium text-sm">Low Rating</p>
                            <p className="text-xs text-gray-600">Toilet received 1-2 stars</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl">⏰</div>
                          <div>
                            <p className="font-medium text-sm">Missed Cleaning</p>
                            <p className="text-xs text-gray-600">Cleaning schedule overdue</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl">📢</div>
                          <div>
                            <p className="font-medium text-sm">Multiple Complaints</p>
                            <p className="text-xs text-gray-600">3+ complaints in 24h</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl">🧹</div>
                          <div>
                            <p className="font-medium text-sm">No Cleaning Log</p>
                            <p className="text-xs text-gray-600">No recent cleaning record</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl">🚨</div>
                          <div>
                            <p className="font-medium text-sm">Emergency Issue</p>
                            <p className="text-xs text-gray-600">No water or broken fixtures</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
          {adminActiveTab === 'analytics' && (
            <div className="space-y-6">
              {analyticsLoading ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Analytics Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Feedback Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Feedback (7 days)</span>
                            <span className="font-medium">{analyticsData?.overview?.totalFeedback || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Average Rating</span>
                            <span className="font-medium">{(analyticsData?.overview?.averageRating || 0).toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Low Ratings</span>
                            <span className="font-medium text-red-600">{analyticsData?.overview?.lowRatingCount || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Cleaning Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Cleanings (7 days)</span>
                            <span className="font-medium">{analyticsData?.overview?.totalCleanings || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Daily Average</span>
                            <span className="font-medium">{((analyticsData?.overview?.totalCleanings || 0) / 7).toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Cleaning Rate</span>
                            <span className="font-medium text-green-600">Good</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top Issues</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {(analyticsData?.overview?.issueDistribution || []).slice(0, 3).map((issue: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                {issue.issue?.replace('_', ' ') || 'Unknown'}
                              </span>
                              <span className="font-medium">{issue.count}</span>
                            </div>
                          ))}
                          {(analyticsData?.overview?.issueDistribution || []).length === 0 && (
                            <p className="text-sm text-gray-500">No issues reported</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Daily Trends Chart Placeholder */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Trends (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📊</div>
                          <p className="text-gray-600">Chart visualization would be implemented here</p>
                          <p className="text-sm text-gray-500">Showing feedback and cleaning trends over time</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Issue Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Issue Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(analyticsData?.overview?.issueDistribution || []).map((issue: any, index: number) => (
                          <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl mb-2">
                              {issue.issue === 'DIRTY_FLOOR' && '🧹'}
                              {issue.issue === 'NO_SOAP' && '🧼'}
                              {issue.issue === 'BAD_SMELL' && '👃'}
                              {issue.issue === 'NO_WATER' && '💧'}
                              {issue.issue === 'BROKEN_FIXTURES' && '🔧'}
                              {issue.issue === 'WET_FLOOR' && '💦'}
                              {issue.issue === 'NO_TISSUE' && '🧻'}
                              {issue.issue === 'TRASH_OVERFLOW' && '🗑️'}
                              {issue.issue === 'OTHER' && '⚠️'}
                            </div>
                            <div className="font-medium">{issue.count}</div>
                            <div className="text-xs text-gray-600">
                              {issue.issue?.replace('_', ' ') || 'Unknown'}
                            </div>
                          </div>
                        ))}
                      </div>
                      {(analyticsData?.overview?.issueDistribution || []).length === 0 && (
                        <p className="text-center text-gray-500 py-8">No issues reported in the selected period</p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <Button 
              onClick={() => setView('landing')}
              variant="outline"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'staff') {
    const checklistItems = [
      { id: 'FLOOR_CLEANED', label: 'Floor Cleaned', icon: '🧹' },
      { id: 'SEAT_SANITIZED', label: 'Seat Sanitized', icon: '🪑' },
      { id: 'TRASH_CLEARED', label: 'Trash Cleared', icon: '🗑️' },
      { id: 'WATER_AVAILABLE', label: 'Water Available', icon: '💧' },
      { id: 'SUPPLIES_REFILLED', label: 'Supplies Refilled', icon: '🧻' },
      { id: 'MIRROR_CLEANED', label: 'Mirror Cleaned', icon: '🪞' },
      { id: 'DOOR_HANDLES_SANITIZED', label: 'Door Handles Sanitized', icon: '🚪' },
    ]

    const handleMarkAsCleaned = async () => {
      if (!selectedToilet || cleaningChecklist.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select a toilet and complete the checklist.",
          variant: "destructive"
        })
        return
      }

      setIsSubmittingCleaning(true)
      
      try {
        const response = await fetch('/api/cleaning-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            toiletId: selectedToilet.id,
            staffId: 'demo-staff-id', // In real app, this would come from authentication
            checklist: JSON.stringify(cleaningChecklist),
            notes: cleaningNotes || null,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to mark as cleaned')
        }

        setIsSubmittingCleaning(false)
        toast({
          title: "Cleaning Logged!",
          description: "Toilet has been marked as cleaned successfully.",
        })
        
        // Reset form
        setSelectedToilet(null)
        setCleaningChecklist([])
        setCleaningNotes('')
        
        // Refresh the toilets list
        const toiletsResponse = await fetch('/api/toilets')
        const toiletsData = await toiletsResponse.json()
        if (toiletsResponse.ok) {
          setAssignedToilets(toiletsData.toilets)
        }
      } catch (error) {
        setIsSubmittingCleaning(false)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to log cleaning. Please try again.",
          variant: "destructive"
        })
      }
    }

    if (staffLoading) {
      return (
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assigned toilets...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cleaning Staff Portal</h1>
            <p className="text-gray-600">Mark toilets as cleaned and update status</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Assigned Toilets */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Toilets</CardTitle>
                <CardDescription>Select a toilet to mark as cleaned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {assignedToilets.map((toilet) => (
                    <div
                      key={toilet.id}
                      onClick={() => setSelectedToilet(toilet)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedToilet?.id === toilet.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{toilet.toiletNumber}</p>
                          <p className="text-sm text-gray-600">{toilet.floor.location.name} - {toilet.floor.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={toilet.status === 'ACTIVE' ? 'secondary' : 'destructive'}>
                              {toilet.status}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {toilet.lastCleanedAt ? 
                                `Cleaned ${Math.round((Date.now() - new Date(toilet.lastCleanedAt).getTime()) / (1000 * 60 * 60))}h ago` : 
                                'Never cleaned'
                              }
                            </div>
                          </div>
                        </div>
                        <div className="text-2xl">🚽</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cleaning Form */}
            <Card>
              <CardHeader>
                <CardTitle>Mark as Cleaned</CardTitle>
                <CardDescription>
                  {selectedToilet ? `${selectedToilet.toiletNumber} - ${selectedToilet.floor.location.name}` : 'Select a toilet first'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3">Cleaning Checklist</label>
                  <div className="space-y-2">
                    {checklistItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={item.id}
                          checked={cleaningChecklist.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCleaningChecklist([...cleaningChecklist, item.id])
                            } else {
                              setCleaningChecklist(cleaningChecklist.filter(id => id !== item.id))
                            }
                          }}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          disabled={!selectedToilet}
                        />
                        <label htmlFor={item.id} className={`text-sm ${!selectedToilet ? 'text-gray-400' : ''}`}>
                          <span className="mr-2">{item.icon}</span>
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cleaning Notes (Optional)</label>
                  <Textarea
                    placeholder="Add any notes about the cleaning..."
                    value={cleaningNotes}
                    onChange={(e) => setCleaningNotes(e.target.value)}
                    disabled={!selectedToilet}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleMarkAsCleaned}
                  disabled={!selectedToilet || cleaningChecklist.length === 0 || isSubmittingCleaning}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isSubmittingCleaning ? 'Submitting...' : 'Mark as Cleaned'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button 
              onClick={() => setView('landing')}
              variant="outline"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'management') {
    if (managementLoading) {
      return (
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading management data...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Location Management</h1>
            <p className="text-gray-600">Manage companies, locations, floors, and toilets</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'companies', label: 'Companies', icon: '🏢' },
                  { id: 'locations', label: 'Locations', icon: '📍' },
                  { id: 'floors', label: 'Floors', icon: '🏢' },
                  { id: 'toilets', label: 'Toilets', icon: '🚽' },
                  { id: 'staff', label: 'Staff', icon: '👥' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Companies</CardTitle>
                  <Button size="sm">Add Company</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companies.map((company) => (
                    <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{company.name}</h3>
                        <p className="text-sm text-gray-600">{company.email}</p>
                        <p className="text-xs text-gray-500">{company.address}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {company._count.locations} locations
                        </div>
                        <div className="text-sm text-gray-600">
                          {company._count.staff} staff
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Locations</CardTitle>
                  <Button size="sm">Add Location</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{location.name}</h3>
                        <p className="text-sm text-gray-600">{location.company.name}</p>
                        <p className="text-xs text-gray-500">
                          {location.city}, {location.state} {location.pincode}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {location._count.floors} floors
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Floors Tab */}
          {activeTab === 'floors' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Floors</CardTitle>
                  <Button size="sm">Add Floor</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {floors.map((floor) => (
                    <div key={floor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">
                          {floor.name || `Floor ${floor.floorNumber}`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {floor.location.name} - {floor.location.company.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {floor._count.toilets} toilets
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Toilets Tab */}
          {activeTab === 'toilets' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Toilets</CardTitle>
                  <Button size="sm">Add Toilet</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Toilet management interface would be implemented here</p>
                  <p className="text-sm">Would include QR code generation, status management, etc.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Staff Members</CardTitle>
                  <Button size="sm">Add Staff</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Staff management interface would be implemented here</p>
                  <p className="text-sm">Would include role management, assignments, performance tracking, etc.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 text-center">
            <Button 
              onClick={() => setView('landing')}
              variant="outline"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <div className="text-4xl">🚽</div>
            </div>
            <CardTitle className="text-3xl text-green-800 mb-2">CleanIndia QR</CardTitle>
            <CardDescription className="text-lg">
              Smart Toilet Monitoring & Hygiene Feedback Platform
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => {
                  // Simulate QR scan with real QR code from database
                  window.history.pushState({}, '', '/?qr=QR-01')
                  // The useEffect will handle fetching the data
                }}
                className="h-16 text-lg bg-green-600 hover:bg-green-700"
              >
                <div className="text-2xl mr-3">📱</div>
                Scan QR Code
                <div className="ml-2 text-sm opacity-75">(Demo Mode)</div>
              </Button>
              
              <Button 
                onClick={() => setView('admin')}
                variant="outline" 
                className="h-16 text-lg border-green-300 text-green-700 hover:bg-green-50"
              >
                <div className="text-2xl mr-3">👨‍💼</div>
                Admin Dashboard
              </Button>

              <Button 
                onClick={() => setView('staff')}
                variant="outline" 
                className="h-16 text-lg border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <div className="text-2xl mr-3">🧹</div>
                Staff Portal
              </Button>

              <Button 
                onClick={() => setView('management')}
                variant="outline" 
                className="h-16 text-lg border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <div className="text-2xl mr-3">🏢</div>
                Management
              </Button>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">How it works:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-2xl">1️⃣</div>
                  <p className="text-sm font-medium">Scan QR Code</p>
                  <p className="text-xs text-gray-600">Located at each toilet</p>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl">2️⃣</div>
                  <p className="text-sm font-medium">Rate & Report</p>
                  <p className="text-xs text-gray-600">Share your feedback instantly</p>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl">3️⃣</div>
                  <p className="text-sm font-medium">Get Action</p>
                  <p className="text-xs text-gray-600">Staff notified immediately</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Badge variant="outline" className="text-green-700 border-green-300 mb-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                Building Trust Through Transparency
              </Badge>
              <p className="text-sm text-gray-600">
                Join us in maintaining clean and hygienic facilities for everyone
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}