# Plan: Notificaciones de recursos críticos

## Contexto

Cuando el usuario consuma o actualice un recurso, el backend verifica si el nuevo `current_amount` quedó por debajo de `min_threshold` y, si es así, envía un mensaje por WebSocket al dispositivo del usuario para que aparezca un banner nativo. Todo sin build nativo.

**Estado actual:** ninguna parte de la implementación existe aún. El inventario ya está completamente funcional — solo hay que conectar las notificaciones.

---

## Flujo

```
Frontend llama PATCH /api/v1/inventory/{id}  o  POST /api/v1/inventory/{id}/logs
        │
        ▼
inventory.py actualiza current_amount en BD  (ya existe)
        │
        ▼
await notify_if_critical(str(user.id), inventory)  ← llamada nueva
        │  current_amount < min_threshold?  Sí
        ▼
manager.send(user_id, { title, body })
        │  WebSocket (conexión persistente en memoria)
        ▼
useNotifications hook (mobile) recibe el mensaje
        │
        ▼
scheduleNotificationAsync({ trigger: null })
        │
        ▼
Banner nativo del SO
```

---

## Archivos a modificar / crear

### Backend

| Archivo | Acción | Detalle |
|---------|--------|---------|
| `api/app/main.py` | Modificar | Agregar `ConnectionManager` + endpoint `@app.websocket("/ws/{user_id}")` |
| `api/app/services/notifications.py` | **Crear** | Helper `notify_if_critical(user_id, inventory)` |
| `api/app/routers/inventory.py` | Modificar | Llamar `notify_if_critical` en `PATCH /{inventory_id}` (línea 150) y en `POST /{inventory_id}/logs` (línea 201) |

### Mobile

| Archivo | Acción | Detalle |
|---------|--------|---------|
| `mobile/package.json` | Modificar | Agregar `expo-notifications` |
| `mobile/app.json` | Modificar | Plugin y permisos de notificación |
| `mobile/src/services/websocket/websocketService.ts` | **Crear** | Cliente WebSocket con reconexión automática |
| `mobile/src/hooks/useNotifications.ts` | **Crear** | Conecta WS → recibe mensaje → `scheduleNotificationAsync` |
| `mobile/src/app/(app)/_layout.tsx` | Modificar | `setNotificationHandler` + `requestPermissionsAsync` + `useNotifications()` |

---

## Implementación detallada

### 1. `ConnectionManager` + WebSocket en `api/app/main.py`

Insertar antes de `app = FastAPI(...)`:

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict

class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.active[user_id] = ws

    def disconnect(self, user_id: str):
        self.active.pop(user_id, None)

    async def send(self, user_id: str, message: dict):
        ws = self.active.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(user_id)

manager = ConnectionManager()
```

Agregar después de los `app.include_router(...)`:

```python
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)
```

### 2. Crear `api/app/services/notifications.py`

```python
from app.main import manager
from app.models.inventory_resource import InventoryResource

async def notify_if_critical(user_id: str, inventory: InventoryResource) -> None:
    if inventory.current_amount < inventory.base_resource.min_threshold:
        await manager.send(user_id, {
            "title": f"⚠️ Recurso crítico: {inventory.base_resource.name}",
            "body": (
                f"Nivel: {inventory.current_amount:.1f} {inventory.base_resource.unit.value} "
                f"(mín: {inventory.base_resource.min_threshold:.1f})"
            ),
        })
```

### 3. Modificar `api/app/routers/inventory.py`

Agregar el import al inicio:
```python
from app.services.notifications import notify_if_critical
```

**En `update_inventory_item` (PATCH) — después de línea 150 (`db.commit()`):**
```python
    db.commit()
    updated = load_inventory_with_base(db, inventory_id, user.id)
    await notify_if_critical(str(user.id), updated)
    return serialize_inventory(updated)
```
> Reemplaza el `return serialize_inventory(load_inventory_with_base(...))` existente.

**En `add_inventory_log` (POST logs) — después de línea 201 (`db.refresh(db_log)`):**
```python
    db.refresh(db_log)
    inventory = load_inventory_with_base(db, inventory_id, user.id)
    await notify_if_critical(str(user.id), inventory)
    return db_log
```

### 4. Instalar `expo-notifications`

```bash
cd mobile && npx expo install expo-notifications
```

### 5. Modificar `mobile/app.json`

Agregar dentro de `"expo"`:
```json
"plugins": [
  "expo-router",
  "expo-sqlite",
  "expo-web-browser",
  "expo-secure-store",
  "expo-font",
  "expo-camera",
  "expo-media-library",
  ["expo-notifications", { "androidMode": "default" }]
],
"android": {
  "permissions": ["NOTIFICATIONS", "RECEIVE_BOOT_COMPLETED", "VIBRATE"]
}
```
> Verificar el array `"plugins"` existente para no duplicar las entradas ya presentes.

### 6. Crear `mobile/src/services/websocket/websocketService.ts`

```typescript
import { useAuthStore } from '@/store/authStore';

const WS_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '')
  .replace('https://', 'wss://')
  .replace('http://', 'ws://');

type NotificationMessage = { title: string; body: string };

class WebSocketService {
  private ws: WebSocket | null = null;
  private retryDelay = 1_000;
  private shouldReconnect = true;

  connect(userId: string, token: string, onMessage: (msg: NotificationMessage) => void) {
    this.shouldReconnect = true;
    this.ws = new WebSocket(`${WS_BASE}/ws/${userId}?token=${token}`);

    this.ws.onopen    = () => { this.retryDelay = 1_000; };
    this.ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
    this.ws.onclose   = () => {
      if (!this.shouldReconnect) return;
      setTimeout(() => {
        const { tokens, dbUser } = useAuthStore.getState();
        if (tokens?.accessToken && dbUser?.id) {
          this.connect(dbUser.id, tokens.accessToken, onMessage);
        }
      }, this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, 30_000);
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
  }
}

export const wsService = new WebSocketService();
```

### 7. Crear `mobile/src/hooks/useNotifications.ts`

```typescript
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/store/authStore';
import { wsService } from '@/services/websocket/websocketService';

export function useNotifications() {
  const tokens = useAuthStore((s) => s.tokens);
  const dbUser = useAuthStore((s) => s.dbUser);

  useEffect(() => {
    if (!tokens?.accessToken || !dbUser?.id) return;

    wsService.connect(dbUser.id, tokens.accessToken, async ({ title, body }) => {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
    });

    return () => wsService.disconnect();
  }, [tokens?.accessToken, dbUser?.id]);
}
```

### 8. Modificar `mobile/src/app/(app)/_layout.tsx`

Reemplazar el contenido completo (actualmente solo 5 líneas):

```typescript
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '@/hooks/useNotifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function AppLayout() {
  useNotifications();

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

---

## Orden de implementación

1. `api/app/main.py` — `ConnectionManager` + endpoint WebSocket
2. `api/app/services/notifications.py` — crear helper `notify_if_critical`
3. `api/app/routers/inventory.py` — agregar las dos llamadas a `notify_if_critical`
4. `npx expo install expo-notifications` (dentro de `mobile/`)
5. `mobile/app.json` — agregar plugin y permisos Android
6. `mobile/src/services/websocket/websocketService.ts` — crear
7. `mobile/src/hooks/useNotifications.ts` — crear
8. `mobile/src/app/(app)/_layout.tsx` — reemplazar con la versión extendida

---

## Verificación

1. `docker-compose up` + `npx expo start` → login en Expo Go
2. Llamar `PATCH /api/v1/inventory/{id}` con un `current_amount` menor al `min_threshold` del recurso, **o** crear un log de consumo (`POST /api/v1/inventory/{id}/logs` con `type: "consumption"`)
3. El backend guarda, llama `notify_if_critical`, envía por WebSocket
4. El banner nativo aparece en el dispositivo inmediatamente
