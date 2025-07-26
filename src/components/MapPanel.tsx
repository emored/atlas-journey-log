import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Trip } from '../types/trip';

interface MapPanelProps {
  trips: Trip[];
  onRouteSelect: (startCoords: [number, number], endCoords: [number, number]) => void;
  selectedTrip?: Trip | null;
  onTripClick?: (trip: Trip, event?: MouseEvent) => void;
}

const TRANSPORT_COLORS = {
  car: '#ef4444',
  walk: '#22c55e', 
  bike: '#f97316',
  bus: '#eab308',
  train: '#8b5cf6',
  plane: '#3b82f6'
};

const MapPanel: React.FC<MapPanelProps> = ({ 
  trips, 
  onRouteSelect, 
  selectedTrip,
  onTripClick 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [startMarker, setStartMarker] = useState<mapboxgl.Marker | null>(null);
  const [endMarker, setEndMarker] = useState<mapboxgl.Marker | null>(null);
  const [previewSource, setPreviewSource] = useState<string | null>(null);
  const [needsMapboxToken, setNeedsMapboxToken] = useState(true);
  const [mapboxToken, setMapboxToken] = useState(() => {
    // Try to get stored token first, or use default token
    return localStorage.getItem('mapbox-token') || 'pk.eyJ1IjoiZW1vcnJyIiwiYSI6ImNtZGpxZW81aTBwNDYybnEzZTk2ZmFtZjMifQ.5UWJmhSeaAw5_5bszs5KnA';
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if we have a valid mapbox token
    const token = mapboxToken.trim();
    
    if (!token) {
      setNeedsMapboxToken(true);
      return;
    }

    try {
      console.log('Initializing Mapbox with token...');
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [0, 20],
        zoom: 2,
        projection: 'globe' as any
      });

      map.current.addControl(new mapboxgl.NavigationControl());

      // Handle map clicks for route selection
      map.current.on('click', (e) => {
        const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        
        console.log('Map clicked:', coords, 'Click count:', clickCount);
        
        if (clickCount === 0) {
          // First click - set start marker
          if (startMarker) startMarker.remove();
          if (endMarker) endMarker.remove();
          if (previewSource && map.current?.getSource(previewSource)) {
            map.current.removeLayer('preview-route');
            map.current.removeSource(previewSource);
          }
          
          const marker = new mapboxgl.Marker({ color: '#22c55e' })
            .setLngLat(coords)
            .addTo(map.current!);
          setStartMarker(marker);
          setClickCount(1);
          console.log('Start marker placed, click count now:', 1);
        } else if (clickCount === 1) {
          // Second click - set end marker and create route
          console.log('Setting end marker');
          const marker = new mapboxgl.Marker({ color: '#ef4444' })
            .setLngLat(coords)
            .addTo(map.current!);
          setEndMarker(marker);
          setClickCount(0);
          
          if (startMarker) {
            const startCoords = startMarker.getLngLat();
            onRouteSelect([startCoords.lng, startCoords.lat], coords);
            drawPreviewRoute([startCoords.lng, startCoords.lat], coords);
          }
          console.log('End marker placed, click count reset to:', 0);
        }
      });

      // Load existing trips
      loadTripsOnMap();

    } catch (error) {
      console.error('Mapbox initialization failed:', error);
      setNeedsMapboxToken(true);
    }

    return () => {
      if (startMarker) startMarker.remove();
      if (endMarker) endMarker.remove();
      map.current?.remove();
    };
  }, [mapboxToken]);

  const drawPreviewRoute = (start: [number, number], end: [number, number]) => {
    if (!map.current) return;

    const sourceId = `preview-route-${Date.now()}`;
    setPreviewSource(sourceId);

    // Simple straight line for preview (in production, you'd use Mapbox Directions API)
    const routeGeoJSON = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: [start, end]
      }
    };

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: routeGeoJSON
    });

    map.current.addLayer({
      id: 'preview-route',
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#64748b',
        'line-width': 3,
        'line-dasharray': [2, 2]
      }
    });
  };

  const loadTripsOnMap = () => {
    if (!map.current) return;

    trips.forEach((trip, index) => {
      const sourceId = `route-${trip.id}`;
      const layerId = `route-layer-${trip.id}`;
      
      // Remove existing source/layer if it exists
      if (map.current!.getLayer(layerId)) {
        map.current!.removeLayer(layerId);
      }
      if (map.current!.getSource(sourceId)) {
        map.current!.removeSource(sourceId);
      }

      const routeGeoJSON = {
        type: 'Feature' as const,
        properties: { tripId: trip.id, ...trip },
        geometry: {
          type: 'LineString' as const,
          coordinates: [trip.startCoords, trip.endCoords]
        }
      };

      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: routeGeoJSON
      });

      map.current!.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': TRANSPORT_COLORS[trip.mode as keyof typeof TRANSPORT_COLORS] || '#64748b',
          'line-width': 4
        }
      });

      // Add click handler for route
      map.current!.on('click', layerId, (e) => {
        if (onTripClick && e.features?.[0]) {
          const feature = e.features[0];
          onTripClick(feature.properties as Trip, e.originalEvent as MouseEvent);
        }
      });

      // Change cursor on hover
      map.current!.on('mouseenter', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current!.on('mouseleave', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });
  };

  const clearPreview = () => {
    if (startMarker) {
      startMarker.remove();
      setStartMarker(null);
    }
    if (endMarker) {
      endMarker.remove();
      setEndMarker(null);
    }
    if (previewSource && map.current?.getSource(previewSource)) {
      map.current.removeLayer('preview-route');
      map.current.removeSource(previewSource);
      setPreviewSource(null);
    }
    setClickCount(0);
  };

  // Re-load trips when trips array changes
  useEffect(() => {
    if (map.current) {
      loadTripsOnMap();
    }
  }, [trips]);

  // Clear preview when a trip is saved
  useEffect(() => {
    if (selectedTrip) {
      clearPreview();
    }
  }, [selectedTrip]);

  if (needsMapboxToken) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center space-y-4 p-6">
          <h3 className="text-lg font-semibold">Mapbox Token Required</h3>
          <p className="text-muted-foreground">Please enter your Mapbox public token to use the map</p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="pk.eyJ1..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
            <button
              onClick={() => {
                if (mapboxToken.trim()) {
                  setNeedsMapboxToken(false);
                  // Store token for reuse
                  localStorage.setItem('mapbox-token', mapboxToken);
                }
              }}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              disabled={!mapboxToken.trim()}
            >
              Connect Map
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your token from{' '}
            <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden shadow-travel" />
      {clickCount === 1 && (
        <div className="absolute top-4 left-4 bg-card text-card-foreground px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Click to set destination</p>
        </div>
      )}
    </div>
  );
};

export default MapPanel;