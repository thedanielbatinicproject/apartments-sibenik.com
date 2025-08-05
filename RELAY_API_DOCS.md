# Relay State Management API

Ovaj dokument opisuje kako funkcionira novi sistem za upravljanje relay stanjima koji je odvojen od solar podataka.

## Struktura

### Datoteke
- `data/public_data/relay_states.json` - Čuva trenutna stanja svih relay-a
- `data/public_data/solars_public.json` - Čuva solar monitoring podatke (bez relay stanja)
- `code/solar/relayStateManager.js` - Manager za relay stanja

### Relay States JSON Format
```json
{
  "relay1": false,
  "relay2": false,
  "relay3": false,
  "relay4": false,
  "lastUpdate": 1733407200000
}
```

## API Endpoint-i

### 1. GET `/api/backyard-management` (za ESP32)
Dohvaća trenutna relay stanja za ESP32 kontroler.

**Request:**
```
GET /api/backyard-management?secret_key=YOUR_SECRET_KEY
```

**Response:**
```json
{
  "success": true,
  "relayStates": {
    "relay1": false,
    "relay2": true,
    "relay3": false,
    "relay4": true
  },
  "timestamp": 1733407200000,
  "message": "Current relay states retrieved"
}
```

### 2. POST `/api/backyard-management` (od ESP32)
Prima podatke od ESP32/senzora. Automatski ekstraktira relay stanja i sprema ih odvojeno.

**Request:**
```json
{
  "secret_key": "YOUR_SECRET_KEY",
  "voltage": 12.5,
  "current": 2.3,
  "relay1": true,
  "relay2": false,
  "relay3": true,
  "relay4": false,
  "timestamp": 1733407200000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data saved successfully",
  "type": "delta",
  "records": 1234,
  "relayStatesUpdated": true
}
```

### 3. GET `/api/relay-states`
Dohvaća samo relay stanja (bez drugih solar podataka).

**Request:**
```
GET /api/relay-states?secret_key=YOUR_SECRET_KEY
```

**Response:**
```json
{
  "success": true,
  "relayStates": {
    "relay1": false,
    "relay2": true,
    "relay3": false,
    "relay4": true
  },
  "lastUpdate": 1733407200000
}
```

### 4. PUT `/api/relay-states`
Ažurira specifična relay stanja.

**Request:**
```json
{
  "secret_key": "YOUR_SECRET_KEY",
  "relay1": true,
  "relay3": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Relay states updated",
  "relayStates": {
    "relay1": true,
    "relay2": true,
    "relay3": false,
    "relay4": true
  },
  "lastUpdate": 1733407300000
}
```

### 5. POST `/api/relay-states/:relayNumber/toggle`
Prebacuje stanje specifičnog relay-a.

**Request:**
```
POST /api/relay-states/1/toggle
```

**Body:**
```json
{
  "secret_key": "YOUR_SECRET_KEY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Relay 1 toggled",
  "relayStates": {
    "relay1": false,
    "relay2": true,
    "relay3": false,
    "relay4": true
  },
  "lastUpdate": 1733407400000
}
```

## Socket.IO Events

### Real-time ažuriranja
- `relayStatesUpdate` - Emituje se kada se ažuriraju relay stanja
- `solarDataUpdate` - Emituje se kada se ažuriraju solar podaci

## Prednosti nove arhitekture

1. **Odvojeni podaci**: Relay control podaci su odvojeni od monitoring podataka
2. **Brže pristupanje**: Relay stanja se čitaju iz male datoteke umesto parsiranja velike solar historie
3. **Real-time kontrola**: Direktni endpoint-i za upravljanje relay-ima
4. **Cache optimizacija**: Relay stanja su u memoriji za brži pristup
5. **Backup kompatibilnost**: Postojeći ESP32 kod i dalje radi bez promjena

## Migracija

Postojeći ESP32 kod može nastaviti koristiti `/api/backyard-management` endpoint-e bez promjena. Novi sistem automatski ekstraktira relay stanja iz incoming podataka i sprema ih odvojeno.
