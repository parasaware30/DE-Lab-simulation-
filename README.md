# DE-Lab Pro — Digital Electronics Virtual Laboratory

**A Professional, Fully Functional, Production-Ready Web Application for Digital Electronics Education and Simulation**

* **Live Production URL:** [https://delab-pro-lab.netlify.app](https://delab-pro-lab.netlify.app)
* **Technology Stack:** React 19, TypeScript (Strict), Vite 8, Tailwind CSS v4, Vitest, React Testing Library, Netlify
* **Zero Dependencies on External APIs or Paid Services**
* **Deterministic Simulation Engine — Zero Artificial/AI Guesswork**
* **No Mandatory Sign-In or Account Required**

---

## 1. Project Overview

**DE-Lab Pro** is an interactive, browser-based digital electronics virtual laboratory designed for undergraduate electrical, electronics, and computer engineering students. It replaces costly breadboards, physical IC trainers, and fragile wiring kits with a deterministic, real-time, software-driven simulation platform.

### Key Capabilities
- **Simulate all 7 fundamental logic gates** with live truth tables and IEEE standard symbols.
- **Visual Drag-and-Drop Circuit Builder** with bezier-curve wiring, interactive high/low signal states, floating input detection, and undo/redo history.
- **Automatic 2ⁿ Truth Table Generator** with multi-output support and CSV export.
- **Safe Boolean Algebra Solver** with an AST parser (strictly no `eval()` or `Function()`), step-by-step simplification logs, mathematical equivalence verification, and automated circuit synthesis.
- **Karnaugh Map (K-Map) Solver** supporting 2, 3, and 4 variables, don't-care conditions, toroidal boundary wrap-around grouping, and minimal SOP/POS extraction.
- **Combinational Circuits Suite** with 9 interactive modules: Half Adder, Full Adder, Half Subtractor, Full Subtractor, 4:1 Multiplexer, 1:4 Demultiplexer, 4-to-2 Priority Encoder, 2-to-4 Decoder, and 2-Bit Magnitude Comparator.
- **Sequential Circuits & Flip-Flops** covering SR, JK (with toggle mode and race-around protection), D, and T flip-flops, 4-bit SISO shift registers, 4-bit ripple counters, and real-time timing waveform graphs.
- **Number System Calculator** with radix conversions (Base-2, 8, 10, 16), 1's and 2's complement calculation with overflow detection, and binary arithmetic with carry tracking.
- **Digital Demonstration Lab** showcasing 6 real-world systems: BCD to 7-segment display, digital binary counter, traffic light controller FSM, 4-bit combination lock, home security alarm, and audio/data multiplexer bus.
- **Learning & Practice Center** featuring digital electronics reference notes, TTL 7400-series IC pinouts, and 18+ interactive quizzes with instant scoring and explanations.
- **Project Vault** allowing local circuit creation, duplication, deletion, JSON backup/restore, and vector SVG export without accounts.

---

## 2. Laboratory Modules (Complete Scope)

| Module | Name | Primary Features |
|---|---|---|
| **Module A** | **Dashboard** | Welcome overview, module search & filtering, sample circuit launchpad, recent local projects, engineering specs strip. |
| **Module B** | **Logic Gate Simulator** | AND, OR, NOT, NAND, NOR, XOR, XNOR. Interactive input switches, dynamic 2/3/4 input scaling, live animated IEEE symbols, truth tables, and TTL IC metadata (7408, 7432, 7404, etc.). |
| **Module C** | **Circuit Builder** | Drag-and-drop workspace, zoom/pan, bezier wires with active glowing states (HIGH=green, LOW=slate), undo/redo, floating input warnings, component inspector. |
| **Module D** | **Truth Table Generator** | Evaluates all 2ⁿ input permutations (up to 10 inputs / 1024 states) using the live simulation engine. Multi-output support, active state highlighting, and CSV export. |
| **Module E** | **Boolean Algebra Solver** | Safe AST parser (zero eval), algebraic step-by-step simplification citing Boolean laws, truth-table equivalence proof, and "Open as Circuit" automatic schematic synthesizer. |
| **Module F** | **K-Map Solver** | 2, 3, and 4 variables in Gray code order (00, 01, 11, 10). Cell toggling (0/1/X), minterm/maxterm entry, toroidal edge/corner grouping, minimal SOP/POS formulas. |
| **Module G** | **Combinational Circuits** | 9 pre-built interactive MSI modules with live switches, output LEDs, truth tables, Boolean equations, and practical applications. |
| **Module H** | **Sequential Circuits** | SR, JK, D, and T flip-flops with manual clock pulse and auto-clock generator (0.5–5 Hz), characteristic tables, 4-bit shift register, ripple counter, and real-time waveform timing diagram. |
| **Module I** | **Number Systems** | Radix conversions with mathematical steps, 1's & 2's complements (4/8/16-bit) with overflow detection, binary addition with carry tracking, bitwise operations. |
| **Module J** | **Demonstration Lab** | 6 real-world systems: 7-segment LED decoder, auto-running digital counter, traffic light state machine, 4-bit combination lock, burglar/fire security alarm, 4-channel MUX bus. |
| **Module K** | **Learning & Quizzes** | 18+ verified digital electronics practice questions across 3 difficulties, instant scoring, answer rationales, TTL IC pinouts, and Boolean algebra theorems. |
| **Module L** | **Project Vault & Export** | Offline LocalStorage persistence, JSON project export/import, SVG vector schematic export, sample preset restore. |

---

## 3. Technology Stack

* **Frontend Framework:** React 19 (`react`, `react-dom`)
* **Language:** TypeScript 5.8+ (Strict type checking enabled)
* **Build System & Dev Server:** Vite 8
* **Styling & Design System:** Tailwind CSS v4 (`@tailwindcss/vite`), custom CSS circuit grids and SVG filters
* **Icons:** `lucide-react`
* **Test Runner:** Vitest 5.0 (`vitest`, `@testing-library/react`, `jsdom`, `@testing-library/jest-dom`)
* **Persistence:** HTML5 LocalStorage with validation and corruption recovery
* **Deployment:** Netlify CLI / Netlify Production CDN

---

## 4. Project Folder Structure

```
c:\Users\Asus\Documents\exam\
├── public/
│   ├── _redirects                  # SPA client-side routing fallback rule
│   └── favicon.svg                 # Application SVG microchip favicon
├── src/
│   ├── assets/                     # Static graphics and icons
│   ├── components/
│   │   ├── common/
│   │   │   ├── ErrorBoundary.tsx   # React crash boundary with recovery UI
│   │   │   ├── HelpModal.tsx       # User guide and keyboard shortcuts modal
│   │   │   └── SettingsModal.tsx   # Theme and local storage settings modal
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Main header, module breadcrumb, theme toggle
│   │   │   └── Sidebar.tsx         # Responsive categorized navigation drawer
│   │   └── modules/
│   │       ├── DashboardModule.tsx     # Module A: Overview & quick launch
│   │       ├── GateSimulatorModule.tsx # Module B: 7 Logic gates tester
│   │       ├── CircuitEditorModule.tsx # Module C: SVG Circuit Builder
│   │       ├── TruthTableModule.tsx    # Module D: Truth table generator
│   │       ├── BooleanSolverModule.tsx # Module E: Boolean algebra simplifier
│   │       ├── KMapModule.tsx          # Module F: Karnaugh map solver
│   │       ├── CombinationalModule.tsx # Module G: 9 MSI circuits lab
│   │       ├── SequentialModule.tsx    # Module H: Flip-flops & waveform diagram
│   │       ├── NumberSystemsModule.tsx # Module I: Radix & arithmetic tools
│   │       ├── DemonstrationsModule.tsx# Module J: 6 Real-world digital demos
│   │       ├── LearningModule.tsx      # Module K: Theory & 18+ quizzes
│   │       └── ProjectsModule.tsx      # Module L: Local project vault
│   ├── engine/
│   │   ├── boolean/
│   │   │   ├── ast.ts                  # AST node definitions
│   │   │   ├── astToCircuit.ts         # Schematic graph synthesis from AST
│   │   │   ├── evaluator.ts            # AST evaluation & Quine-McCluskey simplifier
│   │   │   ├── parser.ts               # Safe recursive descent parser (no eval)
│   │   │   └── tokenizer.ts            # Lexer with implicit AND & postfix NOT
│   │   ├── combinational/
│   │   │   └── circuits.ts             # 9 MSI circuit specifications
│   │   ├── kmap/
│   │   │   └── kmap.ts                 # 2-4 variable Gray code K-Map engine
│   │   ├── learning/
│   │   │   └── quizData.ts             # 18+ verified digital electronics quizzes
│   │   ├── numbers/
│   │   │   └── conversions.ts          # Radix, complements, and binary adder
│   │   ├── sequential/
│   │   │   └── flipflops.ts            # Flip-flop transitions & counter engine
│   │   ├── storage/
│   │   │   └── projectStore.ts         # LocalStorage persistence & JSON import/export
│   │   ├── logicGates.ts               # Pure evaluation of 7 gates
│   │   ├── sampleCircuits.ts           # 4 Pre-built circuit presets
│   │   ├── simulator.ts                # Deterministic signal propagation engine
│   │   ├── truthTableGenerator.ts      # 2ⁿ combinatorial truth table evaluator
│   │   └── types.ts                    # Core digital simulation types
│   ├── test/
│   │   ├── app.test.tsx                # App navigation integration tests
│   │   ├── booleanParser.test.ts       # Lexer, AST parser, and simplification tests
│   │   ├── combinational.test.ts       # Adder, subtractor, MUX, and decoder tests
│   │   ├── kmap.test.ts                # K-Map wrap-around & don't care tests
│   │   ├── logicGates.test.ts          # Truth table tests for all 7 gates
│   │   ├── numberSystems.test.ts       # Radix and 2's complement tests
│   │   ├── sequential.test.ts          # Flip-flop state transition tests
│   │   ├── setup.ts                    # Jest DOM test environment setup
│   │   └── simulator.test.ts           # Wire propagation and circuit validation tests
│   ├── App.tsx                         # Main state router & layout container
│   ├── index.css                       # Tailwind v4 setup & circuit grid styling
│   └── main.tsx                        # React 19 application root entry
├── index.html                          # HTML5 shell with responsive viewport & favicon
├── package.json                        # Dependencies, scripts, and package metadata
├── tsconfig.json                       # Master TypeScript configuration
├── tsconfig.app.json                   # Client-side compiler options
└── vite.config.ts                      # Vite build & Vitest runner configuration
```

---

## 5. Installation and Local Development

### Prerequisites
* **Node.js:** v18.0.0 or higher (v24 LTS recommended)
* **npm:** v9.0.0 or higher

### Step-by-Step Setup
1. **Clone or navigate to the repository directory:**
   ```bash
   cd c:\Users\Asus\Documents\exam
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser to the printed local port (typically `http://localhost:5173`).

---

## 6. Automated Testing Suite

All digital logic components, parsers, and state machines are backed by automated Vitest tests.

Run the test suite with:
```bash
npm run test
```

### Verified Test Results (100% Pass Rate):
* `src/test/logicGates.test.ts` (6 tests) — AND, OR, NOT, NAND, NOR, XOR, XNOR truth table correctness and dominance rules.
* `src/test/booleanParser.test.ts` (6 tests) — Operator precedence, implicit AND, postfix NOT, invalid syntax rejection, absorption law reduction, and equivalence verification.
* `src/test/kmap.test.ts` (3 tests) — 2-variable OR reduction, 4-corner toroidal wrap-around group (`B'D'`), and don't-care condition inclusion.
* `src/test/combinational.test.ts` (5 tests) — Half Adder, Full Adder, 4:1 MUX routing, 4-to-2 Priority Encoder, and 2-Bit Magnitude Comparator.
* `src/test/sequential.test.ts` (5 tests) — SR flip-flop (including invalid $S=1, R=1$ handling), JK toggle, D flip-flop data capture, T flip-flop, and counter rollover.
* `src/test/numberSystems.test.ts` (4 tests) — Base-10 to Base-2/8/16 conversions, 1's/2's complements for positive and negative integers, sign bit detection, and long addition carries.
* `src/test/simulator.test.ts` (3 tests) — Circuit graph wire propagation, automatic truth table generation, floating input detection, and broken wire validation.
* `src/test/app.test.tsx` (5 tests) — Layout navigation, module switching, and ErrorBoundary resilience.

**Total:** 8 Test Files, 37 Unit & Integration Tests Passed.

---

## 7. Production Build and Deployment

### Production Build
Compile and bundle optimized production assets:
```bash
npm run build
```
This runs TypeScript compilation (`tsc -b`) followed by Vite's production bundler, generating the static output in `dist/`.

### Public Deployment
The application is deployed to Netlify:
* **Production HTTPS URL:** [https://delab-pro-lab.netlify.app](https://delab-pro-lab.netlify.app)
* **Deployment Provider:** Netlify Edge Network
* **Configuration:** Includes `public/_redirects` to support single-page application (SPA) client-side deep linking and page refresh without 404 errors.

---

## 8. Circuit Simulation Engine Architecture

The simulation engine is decoupled from UI components and operates deterministically:

1. **Topology Validation (`validateCircuit`):**
   - Verifies all wire endpoints connect to valid nodes and port indices.
   - Flags floating/unconnected gate inputs.
   - Detects multiple competing drivers on a single input pin.

2. **Iterative Signal Propagation (`simulateCircuit`):**
   - Switches and clocks set initial logic levels.
   - Signals propagate along wires to downstream input ports.
   - Gate outputs are evaluated using pure lookup functions.
   - The loop runs until signal levels reach electrical equilibrium or a hard tick limit is hit (detecting astable oscillations).

3. **Sequential State Transitions (`evaluateNode`):**
   - Flip-flops maintain internal state `(q, qBar, prevClock)`.
   - Clock edge transitions ($0 \to 1$) trigger state updates according to characteristic equations.
   - For SR flip-flops, $S=1, R=1$ is explicitly tagged as invalid/metasable (`'X'`).

---

## 9. Boolean Algebra Syntax Guide

The safe Boolean parser supports common mathematical and engineering notations:

| Operation | Supported Symbols | Example | Meaning |
|---|---|---|---|
| **AND** | `*`, `·`, `&`, or implicit juxtaposition | `A * B`, `A · B`, `AB` | Conjunction (both true) |
| **OR** | `+`, `\|` | `A + B`, `A \| B` | Disjunction (either true) |
| **NOT** | Postfix `'`, prefix `!`, `~` | `A'`, `!A`, `~A` | Inversion / Complement |
| **XOR** | `^`, `⊕` | `A ^ B`, `A ⊕ B` | Exclusive OR (odd parity) |
| **Grouping** | `(`, `)` | `(A + B) * C` | Sub-expression precedence |

*Zero JavaScript `eval()` or `Function()` execution is used, preventing code injection and syntax vulnerabilities.*

---

## 10. Four-Member College Mini-Project Team Contribution Plan

This project is structured for a 4-member undergraduate engineering capstone team:

### Member 1: Lead UI/UX Engineer & Circuit Editor
* **Assigned Modules:** Module A (Dashboard), Module C (Circuit Builder Canvas).
* **Key Deliverables:** SVG drag-and-drop workspace, pan/zoom transformation matrix, interactive wire bezier curves, mobile touch responsiveness, dark/light theme integration.

### Member 2: Logic Engine & Boolean Algebra Specialist
* **Assigned Modules:** Module B (Gate Simulator), Module D (Automatic Truth Tables), Module E (Boolean Algebra Solver).
* **Key Deliverables:** Tokenizer, recursive-descent AST parser, Quine-McCluskey algebraic simplifier, Boolean law step logger, truth-table equivalence checker, AST-to-circuit synthesizer.

### Member 3: Circuit Families & State Machine Engineer
* **Assigned Modules:** Module F (K-Map Solver), Module G (Combinational Circuits), Module H (Sequential Circuits).
* **Key Deliverables:** 2–4 variable Gray code K-Map solver with toroidal corner grouping, 9 MSI combinational circuit models, flip-flop state transition engines, clock pulse generators, and real-time SVG waveform timing diagrams.

### Member 4: Number Systems, QA Testing, Exports & Documentation
* **Assigned Modules:** Module I (Number Systems), Module J (Digital Demonstrations), Module K (Learning & Quizzes), Module L (Project Vault).
* **Key Deliverables:** Radix converter, 1's/2's complement calculator with overflow detection, 6 practical demonstration systems (7-segment, traffic light FSM, digital lock), 18+ question quiz bank, Vitest test suite, LocalStorage vault, and deployment pipeline.

---

## 11. Known Limitations & Browser Compatibility

* **Automatic Truth Table Upper Limit:** Capped at 10 primary inputs (1,024 combinations) to prevent browser main-thread freezes.
* **Browser Storage:** Projects are saved in HTML5 `localStorage` (typically 5 MB quota). Exporting projects as JSON files is recommended for long-term archiving across devices.
* **Touch Interaction:** Full touch-drag and tap-to-wire support is tested for mobile screens down to 320px width.
* **Compatibility:** Tested and fully compatible with modern Google Chrome, Microsoft Edge, Mozilla Firefox, and Apple Safari.
