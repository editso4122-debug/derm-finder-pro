import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import { X, Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DoctorMapProps {
  doctorName: string;
  doctorAddress: string;
  onClose: () => void;
  mapboxToken: string;
}

const DoctorMap = ({ doctorName, doctorAddress, onClose, mapboxToken }: DoctorMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [doctorLocation, setDoctorLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Geocode address to get coordinates
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].center as [number, number];
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Get user's current location
  const getUserLocation = (): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true }
      );
    });
  };

  // Get directions route
  const getDirections = async (start: [number, number], end: [number, number]) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxToken}`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        return data.routes[0].geometry;
      }
      return null;
    } catch (error) {
      console.error('Directions error:', error);
      return null;
    }
  };

  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current || !mapboxToken) return;

      setIsLoading(true);

      // Geocode doctor's address
      const docLoc = await geocodeAddress(doctorAddress);
      if (!docLoc) {
        toast({
          title: 'Location not found',
          description: 'Could not find the doctor\'s location on the map.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      setDoctorLocation(docLoc);

      // Initialize map
      mapboxgl.accessToken = mapboxToken;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: docLoc,
        zoom: 14,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add doctor marker
      const doctorMarkerEl = document.createElement('div');
      doctorMarkerEl.className = 'doctor-marker';
      doctorMarkerEl.innerHTML = `
        <div style="background: hsl(var(--primary)); color: white; padding: 8px 12px; border-radius: 8px; font-weight: 600; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 6px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Doctor
        </div>
      `;

      new mapboxgl.Marker(doctorMarkerEl)
        .setLngLat(docLoc)
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${doctorName}</strong><br/>${doctorAddress}`))
        .addTo(map.current);

      // Try to get user location
      try {
        const userLoc = await getUserLocation();
        setUserLocation(userLoc);

        // Add user marker
        const userMarkerEl = document.createElement('div');
        userMarkerEl.innerHTML = `
          <div style="background: #3b82f6; color: white; padding: 8px 12px; border-radius: 8px; font-weight: 600; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            You
          </div>
        `;

        new mapboxgl.Marker(userMarkerEl)
          .setLngLat(userLoc)
          .addTo(map.current);

        // Fit bounds to show both markers
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(docLoc);
        bounds.extend(userLoc);
        map.current.fitBounds(bounds, { padding: 80 });
      } catch (error) {
        console.log('Could not get user location:', error);
      }

      setIsLoading(false);
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, [doctorAddress, mapboxToken]);

  const handleStartDirections = async () => {
    if (!userLocation || !doctorLocation || !map.current) {
      toast({
        title: 'Location required',
        description: 'Please allow location access to get directions.',
        variant: 'destructive',
      });
      return;
    }

    const route = await getDirections(userLocation, doctorLocation);
    if (!route) {
      toast({
        title: 'Route not found',
        description: 'Could not find a route to this location.',
        variant: 'destructive',
      });
      return;
    }

    // Remove existing route layer if any
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    // Add route to map
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: route,
      },
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': 'hsl(var(--primary))',
        'line-width': 5,
        'line-opacity': 0.8,
      },
    });

    toast({
      title: 'Route displayed',
      description: 'Follow the highlighted path to reach the doctor.',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-display font-semibold text-lg">{doctorName}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {doctorAddress}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {userLocation && (
              <Button onClick={handleStartDirections} size="sm">
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Map */}
        <div className="relative h-[calc(100%-80px)]">
          {isLoading && (
            <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          <div ref={mapContainer} className="w-full h-full" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DoctorMap;
