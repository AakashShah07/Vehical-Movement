"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
}

function calculateRotationAngle(
  prev: [number, number],
  curr: [number, number]
): number {
  const [lat1, lng1] = prev;
  const [lat2, lng2] = curr;
  const deltaLng = lng2 - lng1;
  const deltaLat = lat2 - lat1;
  const angle = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
  return angle;
}
interface MapComponentProps {
  routeData: RoutePoint[];
  currentIndex: number;
  isPlaying: boolean;
}

export default function MapComponent({
  routeData,
  currentIndex,
  isPlaying,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const completedPolylineRef = useRef<L.Polyline | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    if (!mapContainerRef.current || !routeData.length) return;

    // Create map
    const map = L.map(mapContainerRef.current).setView(
      [routeData[0].latitude, routeData[0].longitude],
      15
    );


routeData.forEach((point, index) => {
  const color = "#ff1500";

  L.circleMarker([point.latitude, point.longitude], {
    radius: 5,
    color: color,
    fillColor: color,
    fillOpacity: 1,
    weight: 1,
  }).addTo(map);
});

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const vehicleMarker = L.marker(
      [routeData[0].latitude, routeData[0].longitude],
      {
        icon: L.divIcon({
          html: `<img id="car-icon" src="car.png" style="width: 52px; transform: rotate(0deg);" />`,
          className: "custom-icon",
          iconSize: [52, 52],
          iconAnchor: [26, 26],
        }),
      }
    ).addTo(map);

    const allCoordinates: [number, number][] = routeData.map((point) => [
      point.latitude,
      point.longitude,
    ]);
    const routePolyline = L.polyline(allCoordinates, {
      color: "#04145c",
      weight: 3,
      opacity: 0.7,
      dashArray: "5, 5",
    }).addTo(map);
    const completedPolyline = L.polyline([], {
      color: "#3b82f6",
      weight: 4,
      opacity: 0.8,
    }).addTo(map);

    map.fitBounds(routePolyline.getBounds(), { padding: [20, 20] });

    mapRef.current = map;
    vehicleMarkerRef.current = vehicleMarker;
    routePolylineRef.current = routePolyline;
    completedPolylineRef.current = completedPolyline;

    return () => {
      map.remove();
    };
  }, [routeData]);

  useEffect(() => {
    if (
      !vehicleMarkerRef.current ||
      !completedPolylineRef.current ||
      !routeData.length
    )
      return;

    const currentPoint = routeData[currentIndex];
    if (!currentPoint) return;

    const prevPoint = routeData[currentIndex - 1];
    if (prevPoint) {
      const angle = calculateRotationAngle(
        [prevPoint.latitude, prevPoint.longitude],
        [currentPoint.latitude, currentPoint.longitude]
      );

      const iconImg = document.getElementById("car-icon") as HTMLImageElement;
      if (iconImg) {
        iconImg.style.transform = `rotate(${angle}deg)`;
      }
    }

    vehicleMarkerRef.current.setLatLng([
      currentPoint.latitude,
      currentPoint.longitude,
    ]);

    const completedCoordinates: [number, number][] = routeData
      .slice(0, currentIndex + 1)
      .map((point) => [point.latitude, point.longitude]);

    completedPolylineRef.current.setLatLngs(completedCoordinates);

    if (isPlaying && mapRef.current) {
      mapRef.current.panTo([currentPoint.latitude, currentPoint.longitude]);
    }
  }, [currentIndex, routeData, isPlaying]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}
