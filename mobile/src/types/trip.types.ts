export type TripStatus = 'ACTIVE' | 'COMPLETED';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface TripRecord {
  id: string;
  destination: string | null;
  notes: string | null;
  started_at: string;
  ended_at: string | null;
  initial_oxygen: number;
  oxygen_consumed: number;
  status: TripStatus;
  user_id: string;
}

export interface DashboardActiveTrip {
  id: string;
  destination: string | null;
  initial_oxygen: number;
  oxygen_consumed: number;
  started_at: string;
}

export type WaypointStatus = 'PENDING' | 'REACHED';
export type DangerSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TripWaypoint {
  id: string;
  name: string | null;
  latitude: number;
  longitude: number;
  status: WaypointStatus;
  reached_at: string | null;
  trip_id: string;
}

export interface TripDangerZone {
  id: string;
  description: string | null;
  latitude: number;
  longitude: number;
  severity: DangerSeverity;
  trip_id: string;
}