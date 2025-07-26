import React from 'react';
import { X, Calendar, MapPin, StickyNote } from 'lucide-react';
import { Trip } from '../types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TripPopupProps {
  trip: Trip;
  onClose: () => void;
  position: { x: number; y: number };
}

const TRANSPORT_LABELS = {
  car: '🚗 Car',
  walk: '🚶 Walk',
  bike: '🚴 Bike',
  bus: '🚌 Bus', 
  train: '🚆 Train',
  plane: '✈️ Plane'
};

const TripPopup: React.FC<TripPopupProps> = ({ trip, onClose, position }) => {
  const tripDate = new Date(trip.date);
  
  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{ 
        left: position.x + 10, 
        top: position.y - 10,
        transform: 'translate(0, -100%)'
      }}
    >
      <Card className="w-72 pointer-events-auto shadow-glow bg-card/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Trip Details</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {TRANSPORT_LABELS[trip.mode]}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {tripDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          
          <div className="text-sm">
            <span className="font-medium">Distance: </span>
            <span>{Math.round(trip.distance)} km</span>
          </div>
          
          {trip.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Notes</span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">{trip.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TripPopup;