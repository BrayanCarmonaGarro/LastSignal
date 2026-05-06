import { useRef, useState, useCallback } from "react";
import MapView from "react-native-maps";

export interface OverlayMarker {
  id: string;
  coordinate: { latitude: number; longitude: number };
}

export function useMarkerOverlay<T extends OverlayMarker>(markers: T[]) {
  const mapRef = useRef<MapView>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  
  // Ref para cancelar llamadas en vuelo cuando el mapa se desmonta
  const callIdRef = useRef(0);

  const recalculate = useCallback(async () => {
    if (!mapRef.current) return;

    // Cada llamada obtiene su propio ID; si el mapa se desmonta,
    // incrementamos callIdRef para invalidar las llamadas anteriores
    const thisCallId = ++callIdRef.current;

    const next: Record<string, { x: number; y: number }> = {};

    await Promise.all(
      markers.map(async (m) => {
        const { latitude, longitude } = m.coordinate;

        if (
          latitude == null ||
          longitude == null ||
          !isFinite(latitude) ||
          !isFinite(longitude)
        ) {
          return;
        }

        // Verificamos ANTES de la llamada async
        if (!mapRef.current || callIdRef.current !== thisCallId) return;

        try {
          const pt = await mapRef.current.pointForCoordinate(m.coordinate);

          // Verificamos DESPUÉS de la llamada async (el mapa pudo desmontarse mientras esperábamos)
          if (pt && callIdRef.current === thisCallId) {
            next[m.id] = pt;
          }
        } catch {
          // El mapa se desmontó entre la llamada y la respuesta — ignoramos silenciosamente
        }
      })
    );

    // Solo actualizamos el estado si esta llamada sigue siendo la más reciente
    if (callIdRef.current === thisCallId) {
      setPositions(next);
    }
  }, [markers]);

  // Llama esto cuando el MapView se desmonte para cancelar cualquier recalculate en vuelo
  const invalidate = useCallback(() => {
    callIdRef.current++;
  }, []);

  return { mapRef, positions, recalculate, invalidate };
}