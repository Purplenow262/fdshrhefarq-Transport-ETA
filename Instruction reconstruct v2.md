HK Transit PWA - Migration to Long-Term Architecture

This guide details how to refactor your monolithic index.html into the React + Vite + TypeScript structure defined in your PRD.

1. Project Setup

Instead of a single file, your project will be a buildable app.

npm create vite@latest hk-transit-pwa -- --template react-ts
npm install @mui/material @emotion/react @emotion/styled zustand date-fns idb


2. Refactoring The Logic (Step-by-Step)

Step A: The "Joint Route" Logic

Current Problem: The logic for checking if a route is joint (lines 280-310 in index.html) is mixed inside the data fetching promise.
New Solution: Isolate it in src/utils/routeLogic.ts.

// src/utils/routeLogic.ts
export const isJointRoute = (routeNo: string): boolean => {
  // Regex from PRD FR-D1
  if (!/^(1|3|6|9)/.test(routeNo)) return false;
  const numericPart = parseInt(routeNo.replace(/\D/g, ''), 10);
  return numericPart >= 100;
};


Step B: The Store (State Management)

Current Problem: userGroups is read/written to localStorage manually in multiple functions (saveGroups, addStopToGroup, deleteGroup).
New Solution: Use Zustand to handle actions cleanly.

// src/store/useAppStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Stop {
  id: string;
  route: string;
  // ... fully typed stop definition
}

interface AppState {
  groups: Group[];
  addGroup: (name: string) => void;
  removeGroup: (id: string) => void;
  addStopToGroup: (groupId: string, stop: Stop) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      groups: [{ id: 'g1', name: 'Morning', stops: [] }],
      addGroup: (name) => set((state) => ({ 
        groups: [...state.groups, { id: crypto.randomUUID(), name, stops: [] }] 
      })),
      // ... implementation
    }),
    { name: 'hk-transit-storage' }
  )
);


Step C: The ETA Fetcher (Custom Hook)

Current Problem: fetchDashboardEta (lines 665+) manually finds a DOM element ID and sets innerHTML. It is tightly coupled to the View.
New Solution: A hook that just returns data. The UI decides how to show it.

// src/hooks/useEta.ts
import { useQuery } from '@tanstack/react-query';
import { getKmbEta, getCtbEta } from '../services/api';

export const useStopEta = (stop: Stop) => {
  return useQuery({
    queryKey: ['eta', stop.route, stop.id],
    queryFn: async () => {
      // Logic from your "fetchDeparturesForStop" goes here
      // But now it returns a strictly typed object, no HTML
      if (stop.type === 'mtr') return fetchMtr(stop);
      return fetchBus(stop);
    },
    refetchInterval: 30000, // Auto-refresh logic handled here
  });
};


3. Directory Structure (Final)

src/
├── components/
│   ├── Dashboard/
│   │   ├── GroupCard.tsx       # Replaces .group-card HTML generation
│   │   └── StopRow.tsx         # Replaces .saved-stop-item HTML generation
│   ├── Shared/
│   │   ├── RouteIcon.tsx       # Replaces .op-avatar logic
│   │   └── EtaBadge.tsx        # Replaces .saved-eta-item logic
├── hooks/
│   └── useEta.ts               # Encapsulates lines 610-680 of index.html
├── services/
│   ├── kmb.ts                  # API calls isolated
│   └── mtr.ts
├── store/
│   └── useAppStore.ts          # Manages localStorage and userGroups
└── utils/
    └── routeLogic.ts           # The Regex rules for Joint Routes


Why this is better for maintenance:

Debugging: If ETA is wrong, you look at useEta.ts. If the Group delete button fails, you look at useAppStore.ts. No more scrolling through 800 lines of index.html.

UI Updates: You can change the styling of StopRow without accidentally breaking the API fetching logic.

Reliability: TypeScript will scream at you if you try to access kmbData.dest if it might be undefined, preventing white-screen crashes for users.