export type TransportMode = 'car' | 'walk' | 'bike' | 'bus' | 'train' | 'plane';

export interface Trip {
  id: string;
  startCoords: [number, number];
  endCoords: [number, number];
  mode: TransportMode;
  date: string;
  notes: string;
  distance: number; // in kilometers
}