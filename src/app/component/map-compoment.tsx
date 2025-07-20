"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in Leaflet
const vehicleIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743007.png", // replace with your preferred car icon URL
  iconSize: [32, 32],      // adjust size as needed
  iconAnchor: [16, 16],    // center the icon
  popupAnchor: [0, -16],   // optional
})


delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface RoutePoint {
  latitude: number
  longitude: number
  timestamp: string
}

interface MapComponentProps {
  routeData: RoutePoint[]
  currentIndex: number
  isPlaying: boolean
}

export default function MapComponent({ routeData, currentIndex, isPlaying }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const vehicleMarkerRef = useRef<L.Marker | null>(null)
  const routePolylineRef = useRef<L.Polyline | null>(null)
  const completedPolylineRef = useRef<L.Polyline | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !routeData.length) return

    // Create map
    const map = L.map(mapContainerRef.current).setView([routeData[0].latitude, routeData[0].longitude], 15)

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Create custom vehicle icon
   // Create custom vehicle icon
const vehicleIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3085/3085411.png",
  iconSize: [52, 52],
  iconAnchor: [16, 16],
})


    // Create vehicle marker
    const vehicleMarker = L.marker([routeData[0].latitude, routeData[0].longitude], {
      icon: vehicleIcon,
    }).addTo(map)

    // Create full route polyline (light gray)
    const allCoordinates: [number, number][] = routeData.map((point) => [point.latitude, point.longitude])
    const routePolyline = L.polyline(allCoordinates, {
      color: "#d1d5db",
      weight: 3,
      opacity: 0.7,
      dashArray: "5, 5",
    }).addTo(map)

    // Create completed route polyline (blue)
    const completedPolyline = L.polyline([], {
      color: "#3b82f6",
      weight: 4,
      opacity: 0.8,
    }).addTo(map)

    // Fit map to route bounds
    map.fitBounds(routePolyline.getBounds(), { padding: [20, 20] })

    // Store references
    mapRef.current = map
    vehicleMarkerRef.current = vehicleMarker
    routePolylineRef.current = routePolyline
    completedPolylineRef.current = completedPolyline

    return () => {
      map.remove()
    }
  }, [routeData])

  // Update vehicle position and completed route
  useEffect(() => {
    if (!vehicleMarkerRef.current || !completedPolylineRef.current || !routeData.length) return

    const currentPoint = routeData[currentIndex]
    if (!currentPoint) return

    // Update vehicle marker position
    vehicleMarkerRef.current.setLatLng([currentPoint.latitude, currentPoint.longitude])

    // Update completed route
    const completedCoordinates: [number, number][] = routeData
      .slice(0, currentIndex + 1)
      .map((point) => [point.latitude, point.longitude])

    completedPolylineRef.current.setLatLngs(completedCoordinates)

    // Center map on current position if playing
    if (isPlaying && mapRef.current) {
      mapRef.current.panTo([currentPoint.latitude, currentPoint.longitude])
    }
  }, [currentIndex, routeData, isPlaying])

  return <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "400px" }} />
}
