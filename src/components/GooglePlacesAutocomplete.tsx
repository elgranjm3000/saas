'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string, location?: { lat: number; lng: number }) => void;
  placeholder?: string;
  label?: string;
}

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Buscar dirección...',
  label = 'Dirección'
}) => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const autocompleteRef = useRef<any>(null);
  const placesRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkLoaded = () => {
      if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        setHasError(false);
        return true;
      }
      return false;
    };

    // Check immediately
    if (!checkLoaded()) {
      // Check multiple times with increasing delays
      const delays = [100, 300, 500, 1000, 2000];
      const timers = delays.map(delay =>
        setTimeout(() => {
          if (checkLoaded()) {
            // Clear remaining timers if loaded
            timers.forEach(t => clearTimeout(t));
          }
        }, delay)
      );

      // If still not loaded after 2 seconds, show error
      const errorTimer = setTimeout(() => {
        if (!checkLoaded()) {
          setHasError(true);
        }
      }, 3000);

      return () => {
        timers.forEach(t => clearTimeout(t));
        clearTimeout(errorTimer);
      };
    }
  }, []);

  // Calculate dropdown position when predictions change
  useEffect(() => {
    if (predictions.length > 0 && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  }, [predictions.length]);

  const fetchPredictions = useCallback((input: string) => {
    if (!isLoaded || !input) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    if (!autocompleteRef.current) {
      autocompleteRef.current = new google.maps.places.AutocompleteService();
    }

    autocompleteRef.current.getPlacePredictions(
      { input },
      (predictions: any[], status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions);
        } else {
          setPredictions([]);
        }
        setIsLoading(false);
      }
    );
  }, [isLoaded]);

  const getPlaceDetails = useCallback((placeId: string) => {
    if (!isLoaded) return;

    if (!placesRef.current) {
      placesRef.current = new google.maps.places.PlacesService(document.createElement('div'));
    }

    placesRef.current.getDetails(
      { placeId },
      (place: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };

          const address = place.formatted_address || place.name || '';
          onChange(address, location);
        }
        setPredictions([]);
      }
    );
  }, [isLoaded, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange(value);
    if (!hasError) {
      fetchPredictions(value);
    }
  };

  if (hasError) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-4 text-gray-400 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-orange-300 rounded-2xl focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all outline-none"
            placeholder={placeholder}
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
        </div>
        <p className="mt-2 text-xs text-orange-600 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          Google Maps no disponible. Ingresa la dirección manualmente.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-4 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={value}
            disabled
            className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl opacity-60"
            placeholder={placeholder}
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">Cargando Google Maps...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-4 top-4 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
          placeholder={placeholder}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {predictions.length > 0 && (
        <div
          className="fixed z-[9999] bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500">Sugerencias de Google Maps</p>
          </div>
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => getPlaceDetails(prediction.place_id)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
            >
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {prediction.structured_formatting?.main_text}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {prediction.structured_formatting?.secondary_text}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
