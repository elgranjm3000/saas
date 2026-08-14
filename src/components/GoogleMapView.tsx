'use client'
import React, { useMemo } from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

interface GoogleMapProps {
  lat: number;
  lng: number;
  address?: string;
  onLocationChange?: (lat: number, lng: number) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '16px'
};

export const GoogleMapView: React.FC<GoogleMapProps> = ({
  lat,
  lng,
  address,
  onLocationChange
}) => {
  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          onClick={(e) => {
            if (onLocationChange && e.latLng) {
              onLocationChange(e.latLng.lat(), e.latLng.lng());
            }
          }}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: true,
          }}
        >
          <MarkerF
            position={center}
            icon={{
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: '#3b82f6',
              fillOpacity: 1,
              scale: 1.5,
              anchor: new google.maps.Point(12, 24),
            }}
          />
        </GoogleMap>
        {address && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
              <p className="text-sm text-gray-700 flex-1">{address}</p>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 text-center">
        Haz clic en el mapa para ajustar la ubicación precisa
      </p>
    </div>
  );
};
