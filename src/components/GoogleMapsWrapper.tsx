'use client'
import React, { ReactNode, useEffect, useState } from 'react';

interface GoogleMapsWrapperProps {
  children: ReactNode;
}

export const GoogleMapsWrapper: React.FC<GoogleMapsWrapperProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  useEffect(() => {
    if (!apiKey) return;

    // Check if already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error('Error loading Google Maps script');
      setIsLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove the script as it might be used by other components
    };
  }, [apiKey]);

  if (!apiKey) {
    return <>{children}</>;
  }

  // Render children immediately, but they'll handle loading state internally
  return <>{children}</>;
};
