# Project Architecture & Importance Tracker

This document provides a hierarchical map of the system components and a matrix to evaluate their branching depth and actual importance.

## 1. Hierarchical Branching Map

This flowchart tracks what features have branched out from the core application, how deep they go, and how they connect.

```mermaid
flowchart LR
    %% Core System
    Core["BodyOS Core Context"]
    
    %% Main Branches
    Core --> Dashboard["Dashboard UI"]
    Core --> SystemDetail["System Detail Page"]
    Core --> DataStore["Local Storage / DB"]

    %% Dashboard Sub-branches
    Dashboard --> QuickScan["Quick Scan Panel"]
    Dashboard --> Spotlight["System Spotlight"]
    Dashboard --> LiveTracker["Live Tracking List"]

    %% System Detail Sub-branches
    SystemDetail --> SimpleMode["Simple Mode"]
    SystemDetail --> PrecisionMode["Precision Mode"]
    SystemDetail --> MedHistory["Medical History"]

    %% Precision Mode deep branches (The furthest branched out)
    PrecisionMode --> CustomParams["Custom Parameters"]
    PrecisionMode --> Aggregation["Weighted Aggregation"]
    CustomParams --> Sliders["Dynamic Sliders"]
    CustomParams --> WeightDistrib["Weight Distribution Logic"]

    %% Styling
    classDef core fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#fff;
    classDef branch fill:#0f172a,stroke:#3b82f6,color:#cbd5e1;
    classDef deep fill:#020617,stroke:#10b981,color:#a7f3d0;

    class Core core;
    class Dashboard,SystemDetail,DataStore branch;
    class SimpleMode,PrecisionMode,CustomParams,Aggregation,Sliders,WeightDistrib deep;
```

---

## 2. Importance vs. Complexity (X-Y Tracking Matrix)

Use this matrix to map components across two dimensions:
- **X-Axis (Branching / Complexity Depth):** How far removed from core logic (1 = Core / Foundation, 10 = Deeply nested branch).
- **Y-Axis (Actual Importance / Impact):** How essential this is to the primary experience (1 = Nice-to-have / Distraction, 10 = Mission critical).

| Component / Feature | Branching Depth (X: 1–10) | Importance (Y: 1–10) | Category / Verdict | Action Required |
| :--- | :---: | :---: | :--- | :--- |
| **Dashboard State (`DashboardContext`)** | 1 | 10 | 🔴 Critical Foundation | Keep robust & minimal |
| **Precision Aggregation Logic** | 5 | 9 | 🟡 Core Value Driver | Maintain clean math |
| **Custom Parameter Sliders** | 6 | 8 | 🟡 Primary Interaction | Optimize UX/feel |
| **Medical Event & Symptom History** | 3 | 5 | 🟢 Secondary Feature | Keep as supplementary |
| **Quick Body Scan UI** | 2 | 4 | ⚪ Optional Utility | Review utility |
| **Sound Effects / Micro-animations** | 7 | 2 | ⚪ Polish / Non-essential | Keep lightweight |

---

## 3. Quantitative X-Y Visualization

```mermaid
xychart-beta
    title "Feature Importance (Y) vs Branching Depth (X)"
    x-axis "Dashboard Context, System Detail, Precision Mode, Weighted Logic, Custom Sliders"
    y-axis "Importance Score (1-10)" 1 --> 10
    bar [10, 8, 9, 9, 7]
    line [10, 8, 9, 9, 7]
```

---

## 4. Evaluation Checklist

When evaluating whether to keep, prune, or promote any feature:
- [ ] **Core Value Test (Y ≥ 7):** Does this directly serve the primary goal of the user?
- [ ] **Complexity Guard (X ≤ 6):** Is this branch getting too disconnected or difficult to maintain?
- [ ] **Prune / Simplify Flag:** If **Y < 5** and **X > 5**, it's an over-engineered branch — consider simplifying or removing it.
