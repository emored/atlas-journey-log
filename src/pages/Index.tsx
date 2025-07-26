import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import MapPanel from '../components/MapPanel';
import ControlPanel from '../components/ControlPanel';
import TripPopup from '../components/TripPopup';
import { Trip } from '../types/trip';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../hooks/use-toast';
import heroImage from '../assets/atlas-hero.jpg';

const Index = () => {
  const [trips, setTrips] = useLocalStorage<Trip[]>('atlas-trips', []);
  const [pendingRoute, setPendingRoute] = useState<{
    startCoords: [number, number];
    endCoords: [number, number];
  } | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [clickedTrip, setClickedTrip] = useState<Trip | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const { toast } = useToast();

  const handleRouteSelect = (startCoords: [number, number], endCoords: [number, number]) => {
    setPendingRoute({ startCoords, endCoords });
  };

  const handleSaveTrip = (tripData: Omit<Trip, 'id'>) => {
    const newTrip: Trip = {
      ...tripData,
      id: crypto.randomUUID()
    };
    
    setTrips(prev => [...prev, newTrip]);
    setPendingRoute(null);
    setSelectedTrip(newTrip);
    
    toast({
      title: "Trip Saved!",
      description: "Your journey has been added to your atlas.",
    });
  };

  const handleImportData = (data: Trip[]) => {
    setTrips(data);
    toast({
      title: "Data Imported",
      description: `${data.length} trips imported successfully.`,
    });
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(trips, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `atlas-trips-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: "Your travel data has been downloaded.",
    });
  };

  const handleTripClick = (trip: Trip, event?: MouseEvent) => {
    setClickedTrip(trip);
    if (event) {
      setPopupPosition({ x: event.clientX, y: event.clientY });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header 
        className="relative bg-gradient-ocean text-primary-foreground p-6 shadow-travel overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(52, 109, 199, 0.95), rgba(52, 109, 199, 0.8)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="relative z-10 flex items-center gap-4">
          <Globe className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Atlas</h1>
            <p className="text-sm opacity-90">Personal Travel Logger & Route Mapper</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Control Panel - Left Side (30%) */}
        <div className="w-[30%] p-4">
          <ControlPanel
            onSaveTrip={handleSaveTrip}
            onImportData={handleImportData}
            onExportData={handleExportData}
            trips={trips}
            pendingRoute={pendingRoute}
          />
        </div>

        {/* Map Panel - Right Side (70%) */}
        <div className="w-[70%] p-4">
          <MapPanel
            trips={trips}
            onRouteSelect={handleRouteSelect}
            selectedTrip={selectedTrip}
            onTripClick={handleTripClick}
          />
        </div>
      </div>

      {/* Trip Details Popup */}
      {clickedTrip && (
        <TripPopup
          trip={clickedTrip}
          onClose={() => setClickedTrip(null)}
          position={popupPosition}
        />
      )}
    </div>
  );
};

export default Index;
