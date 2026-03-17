# Vélib App 🚲

Application mobile de bike-sharing pour le campus — construite avec **Expo / React Native** et connectée à un backend **FastAPI + PostgreSQL**.

## Stack technique

| Couche | Technologie |
|---|---|
| Mobile | React Native 0.81 · Expo 54 · Expo Router |
| Langage | TypeScript (strict) |
| State | React Context + useReducer |
| Cartes | react-native-maps |
| Backend | FastAPI · PostgreSQL · Supabase |
| Auth | AsyncStorage (local) |

## Fonctionnalités

- **Carte interactive** — stations colorées selon la disponibilité en temps réel
- **Prévisions IA** — prédiction des slots disponibles à +15 / +30 / +60 min via endpoint ML
- **Navigation guidée** — calcul de distance et trajet entre stations
- **Système de balance** — tarification à 0,10 TND/min, recharge en app
- **QR scanner** — déverrouillage de vélo par QR code
- **Gamification** — niveaux Bronze / Silver / Gold selon le score
- **Notifications IA** — alertes sur stock faible, heure de pointe, inactivité

## Stations

| Station | Capacité |
|---|---|
| INSAT | 40 slots |
| Jardins | 30 slots |
| Menzah | 30 slots |
| Ariana | 30 slots |

## Démarrage rapide

### 1. Prérequis

- Node.js ≥ 18
- Expo CLI : `npm install -g expo-cli`
- Backend FastAPI démarré (voir le repo backend)

### 2. Installation

```bash
git clone <repo-url>
cd velib-app
npm install
```

### 3. Variables d'environnement

```bash
cp .env.example .env
```

Éditer `.env` :

```env
# Emulateur Android
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000

# Device physique sur le même réseau Wi-Fi
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000
```

### 4. Lancer l'app

```bash
npx expo start
```

Puis scanner le QR code avec **Expo Go** ou lancer sur émulateur.

## Structure du projet

```
velib-app/
├── app/                        # Écrans (Expo Router, file-based routing)
│   ├── map.tsx                 # Carte principale
│   ├── activeride.tsx          # Trajet en cours
│   ├── qrscan.tsx              # Scanner QR
│   ├── profile.tsx             # Profil utilisateur
│   └── ...
├── src/
│   ├── components/
│   │   ├── StationDetailsModal.tsx     # Modal détail station
│   │   ├── StationPredictionCard.tsx   # Card prévisions IA ← nouveau
│   │   └── NotificationBanner.tsx      # Bannières de notification
│   ├── hooks/
│   │   └── usePredictions.ts           # Hook polling ML ← nouveau
│   ├── context/
│   │   └── AppContext.tsx              # State global
│   ├── constants/
│   │   └── theme.ts                    # Palette couleurs & ombres
│   └── utils/
│       ├── predictions.ts              # Prédictions locales (fallback)
│       ├── aiSimulation.ts             # Génération notifications
│       └── saveTrip.ts                 # Logging Supabase
├── .env.example                        # Template variables d'environnement
└── assets/
```

## Prévisions IA — intégration ML

L'app consomme l'endpoint :

```
GET /ml/predictions/{station_id}
```

Réponse :

```json
{
  "station_id": 1,
  "station_name": "INSAT",
  "current_available": 10,
  "predictions": {
    "15": { "available_slots": 8,  "occupancy_pct": 80.0, "confidence": "high" },
    "30": { "available_slots": 11, "occupancy_pct": 72.5, "confidence": "medium" },
    "60": { "available_slots": 7,  "occupancy_pct": 82.5, "confidence": "low" }
  }
}
```

Le hook `usePredictions` gère :
- Polling automatique toutes les **60 s**
- **3 tentatives** avec délai croissant (0 / 2 / 4 s)
- Annulation propre à la destruction du composant (`AbortController`)

Couleur des pills :

| Condition | Couleur |
|---|---|
| `available_slots > 5` | Vert |
| `available_slots` entre 2 et 5 | Orange |
| `available_slots < 2` | Rouge |

## Compte de démo

```
Email    : ahmed.benali@example.com
Password : demo1234
```

## Contribuer

```bash
# Créer une branche feature
git checkout -b feature/ma-feature

# Vérifier les types
npx tsc --noEmit

# Pousser et ouvrir une PR
git push origin feature/ma-feature
```
