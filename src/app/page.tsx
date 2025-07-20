"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Play, Pause, RotateCcw, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import("./component/map-compoment"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-lg">Loading map...</div>
    </div>
  ),
})

interface RoutePoint {
  latitude: number
  longitude: number
  timestamp: string
}

export default function VehicleTracker() {
  const [routeData, setRouteData] = useState<RoutePoint[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  // Load route data
  useEffect(() => {
    const loadRouteData = async () => {
      try {
        const response = await fetch("/dummy-route.json")
        const data = await response.json()
        setRouteData(data)
      } catch (error) {
        console.error("Failed to load route data:", error)
      }
    }
    loadRouteData()
  }, [])

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Calculate speed between current and previous point
  const calculateSpeed = (currentIdx: number): number => {
    if (currentIdx === 0 || !routeData[currentIdx] || !routeData[currentIdx - 1]) return 0

    const current = routeData[currentIdx]
    const previous = routeData[currentIdx - 1]

    const distance = calculateDistance(previous.latitude, previous.longitude, current.latitude, current.longitude)

    const timeDiff = (new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()) / 1000 / 3600 // hours

    return timeDiff > 0 ? distance / timeDiff : 0 // km/h
  }

  // Start/stop simulation
  const togglePlayback = () => {
    if (isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPlaying(false)
    } else {
      if (!startTimeRef.current) {
        startTimeRef.current = new Date()
      }

      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1
          if (nextIndex >= routeData.length) {
            setIsPlaying(false)
            return prevIndex
          }

          // Calculate and update speed
          const speed = calculateSpeed(nextIndex)
          setCurrentSpeed(speed)

          // Update elapsed time
          if (startTimeRef.current) {
            const elapsed = (new Date().getTime() - startTimeRef.current.getTime()) / 1000
            setElapsedTime(elapsed)
          }

          return nextIndex
        })
      }, 1500) // Move every 1.5 seconds

      setIsPlaying(true)
    }
  }

  // Reset simulation
  const resetSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setCurrentIndex(0)
    setIsPlaying(false)
    setElapsedTime(0)
    setCurrentSpeed(0)
    startTimeRef.current = null
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const currentPoint = routeData[currentIndex]
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Vehicle Tracker</h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={togglePlayback}
              disabled={!routeData.length || currentIndex >= routeData.length - 1}
              className="flex items-center gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button onClick={resetSimulation} variant="outline" className="flex items-center gap-2 bg-transparent">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Map Container */}
        <div className="flex-1 relative">
          {routeData.length > 0 && (
            <MapComponent routeData={routeData} currentIndex={currentIndex} isPlaying={isPlaying} />
          )}
        </div>

        {/* Metadata Panel */}
        <div className="w-full lg:w-80 bg-white border-l p-4 space-y-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Vehicle Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPoint ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Position</label>
                    <div className="text-sm font-mono bg-gray-50 p-2 rounded mt-1">
                      <div>Lat: {currentPoint.latitude.toFixed(6)}</div>
                      <div>Lng: {currentPoint.longitude.toFixed(6)}</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Timestamp</label>
                    <div className="text-sm bg-gray-50 p-2 rounded mt-1">
                      {new Date(currentPoint.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Speed</label>
                    <div className="text-lg font-semibold text-blue-600 bg-blue-50 p-2 rounded mt-1">
                      {currentSpeed.toFixed(1)} km/h
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Elapsed Time</label>
                    <div className="text-lg font-semibold text-green-600 bg-green-50 p-2 rounded mt-1">
                      {formatTime(elapsedTime)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 text-center py-4">No data available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Route Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {currentIndex + 1} / {routeData.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${routeData.length > 0 ? ((currentIndex + 1) / routeData.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {routeData.length > 0 ? Math.round(((currentIndex + 1) / routeData.length) * 100) : 0}% Complete
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Route Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Points:</span>
                <span className="font-medium">{routeData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${isPlaying ? "text-green-600" : "text-gray-600"}`}>
                  {isPlaying ? "Moving" : "Stopped"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
