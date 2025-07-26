import React from 'react';
import { Trip, TransportMode } from '../types/trip';

interface TripAnalyticsProps {
  trips: Trip[];
}

const TRANSPORT_COLORS = {
  car: '#ef4444',
  walk: '#22c55e', 
  bike: '#f97316',
  bus: '#eab308',
  train: '#8b5cf6',
  plane: '#3b82f6'
};

const TRANSPORT_LABELS = {
  car: 'Car',
  walk: 'Walk',
  bike: 'Bike',
  bus: 'Bus',
  train: 'Train',
  plane: 'Plane'
};

const TripAnalytics: React.FC<TripAnalyticsProps> = ({ trips }) => {
  const totalDistance = trips.reduce((sum, trip) => sum + trip.distance, 0);

  const distanceByMode = Object.keys(TRANSPORT_LABELS).map(mode => {
    const modeTrips = trips.filter(trip => trip.mode === mode);
    const modeDistance = modeTrips.reduce((sum, trip) => sum + trip.distance, 0);
    
    return {
      mode: TRANSPORT_LABELS[mode as TransportMode],
      distance: Math.round(modeDistance),
      fill: TRANSPORT_COLORS[mode as TransportMode]
    };
  }).filter(item => item.distance > 0);

  return (
    <div className="space-y-6">
      <div className="text-center p-4 bg-white/10 rounded-lg">
        <h3 className="text-lg font-semibold">Total Distance</h3>
        <p className="text-3xl font-bold">{Math.round(totalDistance)} km</p>
        <p className="text-sm text-white/80">{trips.length} trips logged</p>
      </div>

      {distanceByMode.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold">Distance by Transport Mode</h4>
          <div className="space-y-2">
            {distanceByMode.map((item) => (
              <div key={item.mode} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.mode}</span>
                  <span className="font-medium">{item.distance} km</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(item.distance / Math.max(...distanceByMode.map(d => d.distance))) * 100}%`,
                      backgroundColor: item.fill
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trips.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/80">No trips logged yet.</p>
          <p className="text-sm text-white/60">Start by clicking on the map to create your first route!</p>
        </div>
      )}
    </div>
  );
};

export default TripAnalytics;