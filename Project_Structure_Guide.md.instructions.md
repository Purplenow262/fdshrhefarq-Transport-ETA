Recommended Project Structure for HK Transit PWA

This guide maps the functionality described in PRD v2.3 to specific files in your React (Vite) project.

1. Directory Tree Overview

src/
├── assets/                 # Static images (Operator logos)
├── components/             # Reusable UI components
│   ├── Card/               # Group Cards (FR-B2)
│   ├── List/               # Route List Items (FR-A2)
│   └── Layout/             # Search Bar, Bottom Sheets
├── hooks/                  # Custom React Hooks
│   ├── useEtaFetcher.ts    # Logic for FR-A3 (Auto-fetch)
│   └── useRouteSearch.ts   # Logic for FR-A1
├── services/               # API Integration (Section 6)
│   ├── kmb.ts
│   ├── ctb.ts
│   └── mtr.ts
├── store/                  # State Management (Zustand)
│   └── useStore.ts         # Favorites & Groups (FR-B1)
├── utils/                  # Helper Functions
│   └── routeLogic.ts       # CRITICAL: Joint Route & Regex Logic (FR-D1)
├── App.tsx
└── main.tsx


2. Key Logic Locations

A. Joint Route Identification (FR-D1)

File: src/utils/routeLogic.ts
This is where you should place the specific Regex logic to determine if a route needs dual-fetching.

// src/utils/routeLogic.ts

/**
 * Determines if a route is a Cross-Harbour Joint Route (KMB + CTB).
 * Rule: Starts with 1, 3, 6, 9 AND numeric part >= 100.
 * Excludes: 12A, 6X. Includes: 101, 601, 962.
 */
export const isJointRoute = (routeNo: string): boolean => {
  // 1. Check strict prefix
  if (!/^(1|3|6|9)/.test(routeNo)) return false;

  // 2. Extract number and check magnitude
  const numericPart = parseInt(routeNo.replace(/\D/g, ''), 10);
  return numericPart >= 100;
};


B. API Fetching & Merging (FR-D2, FR-D3)

File: src/hooks/useEtaFetcher.ts
This custom hook handles the complexity of "Dual Fetching" and "Terminus Filtering".

// src/hooks/useEtaFetcher.ts
import { isJointRoute } from '../utils/routeLogic';
import { fetchKmbEta } from '../services/kmb';
import { fetchCtbEta } from '../services/ctb';

export const useEtaFetcher = (route: string, stopId: string, dir: string) => {
  // ... useEffect implementation
  
  if (isJointRoute(route)) {
     // Trigger both APIs
     // Filter results where eta.dir === dir (Terminus Logic)
     // Merge and Sort
  } else {
     // Standard single fetch
  }
};


C. Favorites & Groups Data (FR-B1, FR-B4)

File: src/store/useStore.ts
Using Zustand to manage the data structure defined in the PRD.

// src/store/useStore.ts
interface FavoriteItem {
  route: string;
  stopId: string;
  operator: 'KMB' | 'CTB' | 'MTR';
}

interface Group {
  id: string;
  name: string;
  items: FavoriteItem[];
}
// ... Zustand store implementation


D. UI Components

File: src/components/List/RouteListItem.tsx
Handles the display format 10min (10:01:10) and the Operator Chips for joint routes.