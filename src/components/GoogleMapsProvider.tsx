'use client'
import React from 'react';
import { LoadScript } from '@react-google-maps/api';

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={['places']}
    >
      {children}
    </LoadScript>
  );
};
