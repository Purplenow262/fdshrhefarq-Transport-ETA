Product Requirements Document (PRD): 
HK Transit ETA (PWA) 
Version: 2.3 (Master Compilation) 
Status: Ready for Development 
Platform: Progressive Web App (PWA) on Android 
Development Stack: VS Code, TypeScript, React, Vite 
Design System: Material You (Material Design 3) 
1. Executive Summary 
The goal is to develop a lightweight, high-performance Progressive Web App (PWA) that 
aggregates real-time arrival information (ETA) for major Hong Kong public transport 
operators. 
Unlike standard apps that require repetitive searching, this product focuses on a "Dashboard 
First" approach, allowing users to group specific stops into contexts (e.g., "Morning 
Commute") and view all ETAs instantly. 
2. Scope & Data Sources 
2.1 Supported Operators 
●  MTR (Mass Transit Railway) - Urban Lines 
●  Light Rail (MTR Light Rail in NW New Territories) 
●  KMB (Kowloon Motor Bus) 
●  LWB (Long Win Bus) 
●  CTB (Citybus) 
●  Joint Routes: Cross-harbour routes operated jointly (KMB + CTB). 
2.2 Core Value Propositions 
1.  Unified Search: One search bar for all operators. 
2.  Instant List View: Selecting a route shows ETAs for all stops immediately. 
3.  Contextual Grouping: Users can organize favorites into custom groups. 
4.  Joint Route Logic: Displaying combined departures (3 KMB + 3 CTB) for shared routes 
with robust filtering. 
3. Functional Requirements 
3.1 Module A: Search & Route Detail (The "List View") 
●  FR-A1 (Unified Search): User can search by Route Number (e.g., "968", "101") or MTR 
Line Name. 
●  FR-A2 (Immediate Detail): Upon selecting a route, the app transitions to a Scrollable 
List View containing ALL stops for that route. 
●  FR-A3 (Auto-Fetch ETA): The app must automatically fetch and display the ETA for 
every stop in the visible list. 
○  Display Format: 10min (10:01:10) 
○  Loading State: Skeleton loader while fetching. 
●  FR-A4 (Direction Toggle): A prominent toggle (Segmented Button) at the top to switch 
between "Inbound" and "Outbound". 
3.2 Module B: The Dashboard (Favorites & Groups) 
●  FR-B1 (Long-Press to Save): Long-press on any stop row -> "Add to Group" Bottom 
Sheet. 
●  FR-B2 (Grouped Display): Home Screen shows Group Cards (e.g., "Work", "Home"). 
●  FR-B3 (Batch Refresh): Pull-to-refresh updates all; Group Header button updates 
specific group. 
●  FR-B4 (Management): Rename, delete, or reorder groups via drag-and-drop. 
3.3 Module C: MTR & Light Rail Logic 
●  FR-C1 (MTR): Stations show ETAs for both directions simultaneously. 
○  Example: "To Chai Wan: 2min (10:01:10) | To Kennedy Town: 4min (10:03:10)" 
●  FR-C2 (Light Rail): Ordered sequence of stops with ETAs. 
3.4 Module D: Joint Route Logic (Updated) 
●  FR-D1 (Identification Logic - "The 12A Exclusion"): 
The app must algorithmically determine if a route is a Cross-Harbour Joint Route using 
strict validation to avoid false positives (e.g., ensuring "12A" is treated as Local, while 
"101" is Joint). 
○  Rule: A route is considered "Joint/Cross-Harbour" if and only if: 
1.  It starts with 1, 3, 6, or 9. 
2.  AND the numeric part of the route is >= 100. 
○  Logic: 
const isJointRoute = (routeNo: string): boolean => {   // Must start with 1, 3, 6, 9   if (!/^(1|3|6|9)/.test(routeNo)) return false;    // Parse the numeric part (e.g., "12A" -> 12, "101" -> 101, "962X" -> 962)   const numericPart = parseInt(routeNo.replace(/\D/g, ''), 10);    // Exclude local routes like 12A, 3M, 6X which are < 100   // Include cross-harbour routes like 101, 307, 601, 962 which are >= 100   return numericPart >= 100; }; 
 
●  FR-D2 (Dual Fetching): 
For identified Joint Routes, the app must fetch ETA data from BOTH KMB and CTB 
endpoints. 
●  FR-D3 (Combined Display & Terminus Filtering): 
○  Merge: Display up to 6 departures (3 KMB + 3 CTB), sorted by time. 
○  Strict Direction Filtering (Terminus Fix): 
■  The app must strictly match the API response's dir (Direction/Bound) field with 
the currently selected route direction. 
■  Scenario: If the user is viewing Route 101 Inbound (To Kwun Tong) and scrolls to 
the terminus (Kwun Tong), the app must discard any ETAs returned by the API 
that are labeled as Outbound (To Kennedy Town). 
■  Result: The terminus stop should typically show "No Departure" or empty state, 
rather than showing the return trip's time incorrectly. 
4. Technical Architecture (PWA Specification) 
4.1 Technology Stack 
●  Language: TypeScript 
●  Framework: React + Vite 
●  PWA: vite-plugin-pwa 
●  UI: MUI (Material UI) v5+ 
4.2 Data Strategy 
Data Layer  Storage  Purpose 
Static  IndexedDB  Route lists, Stop names. 
Used to identify Joint 
Routes (check if Route No. 
exists in both KMB and CTB 
static JSONs). 
Dynamic  React Query  Real-time ETA. 
4.3 Batch Fetching & Filtering Logic (Detail) 
●  KMB: Use /v1/transport/kmb/route-eta/{route}/{service_type}. 
●  Citybus: Lazy load /eta/{company_id}/{stop_id}/{route}. 
●  Joint Route Algorithm (FR-D1 & FR-D3 Implementation): 
// 1. Identification if (isJointRoute(routeNo)) {     // 2. Fetch Both 
    const [kmbData, ctbData] = await Promise.all([fetchKMB(), fetchCTB()]);      // 3. Filter by Direction (Crucial for Terminus)     // Assume currentViewDirection is 'O' (Outbound)     const validKMB = kmbData.filter(eta => eta.dir === 'O');     const validCTB = ctbData.filter(eta => eta.dir === 'O');      // 4. Merge & Sort     const combined = [...validKMB, ...validCTB]         .sort((a, b) => a.timestamp - b.timestamp)         .slice(0, 6); // Take top 6 }  
5. UI/UX Design System (Material You) 
5.1 Theming 
●  Dynamic Color: @material/material-color-utilities based on seed color. 
5.2 Component Specs 
●  Route Lists (Standard): 1-3 Lines of ETA. 
●  Route Lists (Joint): 
○  Format: [LOGO] 10min (10:01:10) 
○  Visual: Vertical list with small Operator Chips (Red for KMB, Yellow for CTB). 
6. API Implementation Reference 
A. KMB & LWB 
●  Base: https://data.etabus.gov.hk 
●  Full Route ETA: /v1/transport/kmb/route-eta/{route}/{service_type} 
●  Note: API returns dir as "I" (Inbound) or "O" (Outbound). Map this carefully. 
B. Citybus (CTB) 
●  Base: https://rt.data.gov.hk/v2/transport/citybus 
●  ETA: /eta/{company_id}/{stop_id}/{route} 
●  Note: API returns dir as "I" or "O". 
C. MTR 
●  Base: https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php