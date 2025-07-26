import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, BarChart3, MapPin, Save, Download, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Trip, TransportMode } from '../types/trip';
import TripAnalytics from './TripAnalytics';

interface ControlPanelProps {
  onSaveTrip: (trip: Omit<Trip, 'id'>) => void;
  onImportData: (data: Trip[]) => void;
  onExportData: () => void;
  trips: Trip[];
  pendingRoute?: {
    startCoords: [number, number];
    endCoords: [number, number];
  } | null;
}

const TRANSPORT_MODES: { value: TransportMode; label: string; icon: string }[] = [
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'walk', label: 'Walk', icon: '🚶' },
  { value: 'bike', label: 'Bike', icon: '🚴' },
  { value: 'bus', label: 'Bus', icon: '🚌' },
  { value: 'train', label: 'Train', icon: '🚆' },
  { value: 'plane', label: 'Plane', icon: '✈️' },
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  onSaveTrip,
  onImportData,
  onExportData,
  trips,
  pendingRoute
}) => {
  const [view, setView] = useState<'logger' | 'analytics'>('logger');
  const [mode, setMode] = useState<TransportMode | ''>('');
  const [date, setDate] = useState<Date>();
  const [notes, setNotes] = useState('');

  const handleSaveTrip = () => {
    if (!pendingRoute || !mode || !date) return;

    const trip: Omit<Trip, 'id'> = {
      startCoords: pendingRoute.startCoords,
      endCoords: pendingRoute.endCoords,
      mode,
      date: date.toISOString(),
      notes,
      distance: calculateDistance(pendingRoute.startCoords, pendingRoute.endCoords)
    };

    onSaveTrip(trip);
    
    // Clear form
    setMode('');
    setDate(undefined);
    setNotes('');
  };

  const calculateDistance = (start: [number, number], end: [number, number]): number => {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = (end[1] - start[1]) * Math.PI / 180;
    const dLon = (end[0] - start[0]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(start[1] * Math.PI / 180) * Math.cos(end[1] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        onImportData(data);
      } catch (error) {
        console.error('Invalid JSON file:', error);
      }
    };
    reader.readAsText(file);
  };

  if (view === 'analytics') {
    return (
      <Card className="h-full bg-gradient-ocean text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Travel Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <TripAnalytics trips={trips} />
          
          <div className="space-y-3">
            <Button 
              onClick={() => setView('logger')} 
              variant="secondary"
              className="w-full"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Back to Logger
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onExportData}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              
              <label className="cursor-pointer">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  asChild
                >
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-gradient-adventure text-primary-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Trip Logger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transport-mode">Transport Mode</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as TransportMode)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select transport mode" />
              </SelectTrigger>
              <SelectContent>
                {TRANSPORT_MODES.map((transport) => (
                  <SelectItem key={transport.value} value={transport.value}>
                    <span className="flex items-center gap-2">
                      <span>{transport.icon}</span>
                      {transport.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Trip Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20",
                    !date && "text-white/70"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Trip details, memories, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleSaveTrip}
            disabled={!pendingRoute || !mode || !date}
            className="w-full bg-white text-adventure hover:bg-white/90"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Trip
          </Button>

          <Button 
            onClick={() => setView('analytics')} 
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </div>

        {pendingRoute && (
          <div className="p-3 bg-white/10 rounded-lg">
            <p className="text-sm font-medium">Route Preview</p>
            <p className="text-xs text-white/80">
              Click on the map to set start and end points
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ControlPanel;