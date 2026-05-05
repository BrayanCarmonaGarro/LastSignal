import { useRef, useState, useCallback } from "react";
import MapView from "react-native-maps";

export interface OverlayMarker {
  id: string;
  coordinate: { latitude: number; longitude: number };
}

export function useMarkerOverlay<T extends OverlayMarker>(markers: T[]) {
  const mapRef = useRef<MapView>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  const recalculate = useCallback(async () => {
    if (!mapRef.current) return;
    const next: Record<string, { x: number; y: number }> = {};
    await Promise.all(
      markers.map(async (m) => {
        const pt = await mapRef.current!.pointForCoordinate(m.coordinate);
        if (pt) next[m.id] = pt;
      })
    );
    setPositions(next);
  }, [markers]);

  return { mapRef, positions, recalculate };
}